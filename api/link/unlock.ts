import { hashIp } from '../../utils/ipHash';

/**
 * Checks a password-protected link's password and returns the link with its
 * destination when it matches.
 *
 * The browser used to call the unlock_link database function directly, with
 * no limit on guesses. Now only this endpoint can check a password, and the
 * database stops accepting guesses for a link after 5 wrong ones from one
 * visitor in 15 minutes, or 100 from everyone in an hour (see
 * migrations/20261101_unlock_attempt_limit.sql).
 *
 * 200 {link} | 401 {error:'wrong_password'} | 429 {error:'too_many_attempts'}
 */
export const config = { runtime: 'edge' };

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let code: unknown, password: unknown;
    try {
        ({ code, password } = await request.json());
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    if (typeof code !== 'string' || !code || code.length > 100) return json({ error: 'Invalid code' }, 400);
    if (typeof password !== 'string' || !password || password.length > 200) return json({ error: 'wrong_password' }, 401);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json({ error: 'Not configured' }, 503);

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const visitor = (await hashIp(ip, process.env.IP_HASH_SALT || serviceKey)) ?? 'unknown';

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/unlock_link_checked`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_short_code: code, p_password: password, p_visitor: visitor }),
    });
    if (!res.ok) {
        console.error('[unlock] check failed:', res.status, await res.text());
        return json({ error: 'Could not check password' }, 500);
    }

    const result = (await res.json()) as { status?: string; link?: unknown } | null;
    if (result?.status === 'ok' && result.link) return json({ link: result.link });
    if (result?.status === 'limited') return json({ error: 'too_many_attempts' }, 429);
    return json({ error: 'wrong_password' }, 401);
}
