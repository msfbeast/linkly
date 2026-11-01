import { kv } from '@vercel/kv';
import { createClient } from '@supabase/supabase-js';
import { type LinkCacheRow, LINK_CACHE_COLUMNS, LINK_CACHE_TTL_SECONDS, linkCacheKey, toCacheEntry } from '../_lib/linkCache';

export const config = {
    runtime: 'edge',
};

/**
 * KV cache sync endpoint.
 *
 * SECURITY MODEL (hardened 2026-07):
 * - Caller must present a valid Supabase JWT.
 * - Caller must own the link (links.user_id matches the JWT user).
 * - The KV payload is built from the DATABASE row, never from the request
 *   body — so even a valid user cannot poison the cache for a short code
 *   with an arbitrary destination URL.
 */

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

export default async function handler(request: Request) {
    if (request.method !== 'POST' && request.method !== 'DELETE') {
        return new Response('Method not allowed', { status: 405 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        console.error('[Sync] Server misconfiguration: missing Supabase env');
        return json({ error: 'Server misconfiguration' }, 500);
    }

    // 1. Authenticate caller
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Missing Authorization header' }, 401);
    }
    const token = authHeader.split(' ')[1];

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
        return json({ error: 'Unauthorized' }, 401);
    }

    try {
        const { shortCode } = await request.json();
        if (!shortCode || typeof shortCode !== 'string') {
            return json({ error: 'Missing shortCode' }, 400);
        }

        // 2. Load the link from the DB and verify ownership
        const admin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: link, error: linkError } = await admin
            .from('links')
            .select(`user_id, team_id, ${LINK_CACHE_COLUMNS}`)
            .eq('short_code', shortCode)
            .maybeSingle();

        // Caller is authorized if they own the link, or are a member of the
        // link's team (team members legitimately edit each other's links,
        // and a blocked sync would leave a stale destination in KV).
        const isAuthorized = async (): Promise<boolean> => {
            if (!link) return false;
            if (link.user_id === user.id) return true;
            if (!link.team_id) return false;
            const { data: membership } = await admin
                .from('team_members')
                .select('user_id')
                .eq('team_id', link.team_id)
                .eq('user_id', user.id)
                .maybeSingle();
            return !!membership;
        };

        if (request.method === 'DELETE') {
            // Allow delete when the link row is already gone (cleanup after
            // DB delete) — but if it exists, the caller must be authorized.
            if (link && !(await isAuthorized())) {
                return json({ error: 'Forbidden' }, 403);
            }
            await kv.del(linkCacheKey(shortCode));
            return json({ success: true }, 200);
        }

        // POST: sync from DB
        if (linkError || !link) {
            return json({ error: 'Link not found' }, 404);
        }
        if (!(await isAuthorized())) {
            return json({ error: 'Forbidden' }, 403);
        }

        // Archived links and expired guest links leave the cache instead.
        const entry = toCacheEntry(link as LinkCacheRow);
        if (entry) {
            await kv.set(linkCacheKey(shortCode), entry, { ex: LINK_CACHE_TTL_SECONDS });
        } else {
            await kv.del(linkCacheKey(shortCode));
        }

        return json({ success: true }, 200);
    } catch (error) {
        console.error('[Sync] API Error:', error);
        return json({ error: 'Internal Server Error' }, 500);
    }
}
