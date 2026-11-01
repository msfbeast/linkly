import { hashIp } from '../utils/ipHash';
import { shouldCount } from './_lib/countLimit';

/**
 * Counts a bio page view. The browser used to call the increment_bio_view
 * database function directly, which let anyone with the public key add any
 * number of views to any profile. Now only this endpoint can, at most
 * BIO_VIEWS_PER_10_MIN times per visitor per profile.
 */
export const config = { runtime: 'edge' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let profileId: unknown;
    try {
        ({ profileId } = await request.json());
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    if (typeof profileId !== 'string' || !UUID.test(profileId)) return json({ error: 'Invalid profileId' }, 400);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json({ error: 'Not configured' }, 503);

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const ipHash = await hashIp(ip, process.env.IP_HASH_SALT || serviceKey);
    if (!(await shouldCount('bio', profileId, ipHash))) return json({ success: true, counted: false });

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_bio_view`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId }),
    });
    if (!res.ok) {
        console.error('[bio-view] increment failed:', res.status, await res.text());
        return json({ error: 'Failed to count view' }, 500);
    }
    return json({ success: true, counted: true });
}
