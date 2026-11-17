import { hashIp } from '../../utils/ipHash';
import { safeWebUrl } from '../../utils/safeUrl';
import { newShortCode } from '../../utils/shortCode';
import { allowGuestLink, GUEST_LINKS_PER_HOUR } from '../_lib/guestLimit';
import { recordServerError } from '../_lib/errorLog';

/**
 * Shortens a link for a visitor without an account (the landing page).
 *
 * Browsers used to call create_guest_link directly with the public key, as
 * often as they liked. Now only this endpoint can: it checks the address,
 * makes the short code, and allows GUEST_LINKS_PER_HOUR per visitor.
 * Guest links stop working after 7 days unless claimed by signing up
 * (migrations/20261117_guest_link_limits.sql).
 *
 * 200 {id, shortCode, claimToken} | 400 | 429 {error:'too_many_links', retryAfter}
 */
export const config = { runtime: 'edge' };

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
    });

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let url: unknown, sessionId: unknown;
    try {
        ({ url, sessionId } = await request.json());
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    const destination = typeof url === 'string' && url.length <= 2048 ? safeWebUrl(url) : null;
    if (!destination) return json({ error: 'Enter a web address, like https://example.com/page.' }, 400);
    if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 100) {
        return json({ error: 'Invalid session' }, 400);
    }
    // Don't shorten our own short links (loops, and a way to hide a destination twice).
    const host = new URL(destination).hostname.replace(/^www\./, '');
    if (host === new URL(request.url).hostname.replace(/^www\./, '')) {
        return json({ error: 'That is already a short link.' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json({ error: 'Not configured' }, 503);

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const visitor = (await hashIp(ip, process.env.IP_HASH_SALT || serviceKey)) ?? 'unknown';
    const allowed = await allowGuestLink(visitor);
    if (!allowed.ok) {
        return json(
            { error: 'too_many_links', message: `You can shorten ${GUEST_LINKS_PER_HOUR} links an hour without an account. Sign up for free to make more.`, retryAfter: allowed.retryAfter },
            429,
            { 'Retry-After': String(allowed.retryAfter ?? 3600) },
        );
    }

    // A random code can collide with an existing one; try a couple of times.
    for (let attempt = 0; attempt < 3; attempt++) {
        const shortCode = newShortCode();
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/create_guest_link`, {
            method: 'POST',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ p_original_url: destination, p_short_code: shortCode, p_guest_session_id: sessionId }),
        });
        if (res.ok) {
            const data = (await res.json()) as { id?: string; claim_token?: string } | null;
            return json({ id: data?.id, shortCode, claimToken: data?.claim_token });
        }
        const text = await res.text();
        if (res.status === 409 || /23505|duplicate key/.test(text)) continue;
        console.error('[guest-link] create failed:', res.status, text);
        await recordServerError('guest-link', new Error(`create_guest_link ${res.status}: ${text.slice(0, 300)}`), request);
        if (res.status === 400 && /22023/.test(text)) {
            return json({ error: 'Enter a web address, like https://example.com/page.' }, 400);
        }
        return json({ error: 'Could not shorten the link' }, 500);
    }
    return json({ error: 'Could not shorten the link' }, 500);
}
