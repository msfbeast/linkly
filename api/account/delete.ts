import { kv } from '@vercel/kv';
import { createClient } from '@supabase/supabase-js';
import { linkCacheKey } from '../_lib/linkCache';

export const config = {
    runtime: 'edge',
};

/**
 * POST /api/account/delete — the signed-in user deletes their own account.
 *
 * Body: { confirmEmail } — must match the account's email.
 * Paid plans are refused (409 paid_plan): the subscription has to be
 * cancelled first, which goes through support.
 *
 * Order: links first (links.user_id has no ON DELETE, so the auth user
 * can't be deleted while they exist; deleting them cascades their clicks,
 * rollups and reports), then their redirect cache entries, uploaded files,
 * and finally the auth user, which cascades the profile, bio page,
 * products, tags, API keys and the rest.
 */

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Buckets that keep files under a `<user id>/` folder. */
export const USER_BUCKETS = ['avatars', 'app-icons', 'gallery-images', 'product-images', 'tech-vault', 'digital-products'];

export default async function handler(request: Request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Server misconfiguration' }, 500);

    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Sign in again to delete your account' }, 401);
    const { data: { user }, error: authError } = await createClient(supabaseUrl, anonKey).auth.getUser(auth.slice(7));
    if (authError || !user) return json({ error: 'Sign in again to delete your account' }, 401);

    let confirmEmail = '';
    try {
        const body = await request.json();
        confirmEmail = typeof body?.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : '';
    } catch { /* handled below */ }
    if (!user.email || confirmEmail !== user.email.toLowerCase()) {
        return json({ error: 'Type your account email to confirm' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: profile } = await admin.from('profiles').select('subscription_tier').eq('id', user.id).maybeSingle();
    if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
        return json({ error: 'paid_plan' }, 409);
    }

    // 1. Links (and, by cascade, their clicks).
    const { data: deleted, error: linksError } = await admin.from('links').delete().eq('user_id', user.id).select('short_code');
    if (linksError) {
        console.error('[Account delete] links failed', linksError);
        return json({ error: 'Could not delete your account. Try again, or email support.' }, 500);
    }

    // 2. Stop the deleted links redirecting from the cache (entries also expire on their own).
    const codes = (deleted || []).map((r: { short_code: string | null }) => r.short_code).filter((c): c is string => !!c);
    for (let i = 0; i < codes.length; i += 100) {
        try { await kv.del(...codes.slice(i, i + 100).map(linkCacheKey)); } catch (e) { console.error('[Account delete] KV delete failed', e); }
    }

    // 3. Uploaded files (best effort: a leftover file is orphaned, not exposed to anyone new).
    for (const bucket of USER_BUCKETS) {
        try {
            const { data: files } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
            const paths = (files || []).map(f => `${user.id}/${f.name}`);
            if (paths.length) await admin.storage.from(bucket).remove(paths);
        } catch (e) {
            console.error(`[Account delete] ${bucket} cleanup failed`, e);
        }
    }

    // 4. The account itself.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
        console.error('[Account delete] auth user failed', deleteError);
        return json({ error: 'Your links were deleted, but the account could not be. Try again, or email support.' }, 500);
    }

    return json({ deleted: true }, 200);
}
