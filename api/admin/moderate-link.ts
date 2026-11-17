import { kv } from '@vercel/kv';
import { linkCacheKey } from '../_lib/linkCache';

/**
 * Admin moderation of a reported link: disable, enable, or dismiss its
 * reports. The database decides who is an admin (admin_moderate_link runs
 * with the caller's token and refuses everyone else); this endpoint exists
 * so the redirect cache can be cleared straight away, which browsers can't do.
 *
 * POST {linkId, action: 'disable'|'enable'|'dismiss', reason?}
 * Authorization: Bearer <user access token>
 */
export const config = { runtime: 'edge' };

const ACTIONS = new Set(['disable', 'enable', 'dismiss']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Sign in first' }, 401);

    let body: { linkId?: unknown; action?: unknown; reason?: unknown };
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    if (typeof body.linkId !== 'string' || !UUID.test(body.linkId)) return json({ error: 'Invalid link' }, 400);
    if (typeof body.action !== 'string' || !ACTIONS.has(body.action)) return json({ error: 'Invalid action' }, 400);
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : null;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return json({ error: 'Not configured' }, 503);

    // As the caller: the function checks they are a platform admin.
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_moderate_link`, {
        method: 'POST',
        headers: { apikey: anonKey, Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_link_id: body.linkId, p_action: body.action, p_reason: reason }),
    });
    if (!res.ok) {
        const text = await res.text();
        if (/42501|Not allowed/.test(text)) return json({ error: 'Not allowed' }, 403);
        if (/P0002|not found/i.test(text)) return json({ error: 'Link not found' }, 404);
        console.error('[moderate-link] failed:', res.status, text);
        return json({ error: 'Could not update the link' }, 500);
    }
    const shortCode = (await res.json()) as string;

    // The redirect reads KV first: drop the entry so the change applies now.
    // The next visit rebuilds it from the database (with disabled_at).
    try {
        await kv.del(linkCacheKey(shortCode));
    } catch (e) {
        console.error('[moderate-link] cache clear failed (entry expires within 7 days):', e);
    }
    return json({ ok: true, shortCode });
}
