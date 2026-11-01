import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';
import { linkCacheKey } from '../_lib/linkCache';

// Edge, like every other function that uses @vercel/kv: as a Node function
// importing @vercel/kv this crashed on load (FUNCTION_INVOCATION_FAILED).
export const config = {
    runtime: 'edge',
};

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(request: Request): Promise<Response> {
    // 1. Verify Cron Secret. Fail closed when it isn't set: comparing against
    // `Bearer ${undefined}` would accept the literal header "Bearer undefined".
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs service role for deletion
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
        // 2. Delete Expired Guest Links, and their redirect cache entries
        //    (otherwise a deleted guest link keeps redirecting from KV).
        const { data: deleted, error } = await supabase
            .from('links')
            .delete()
            .eq('is_guest', true)
            .lt('expires_at', new Date().toISOString())
            .select('short_code');

        if (error) throw error;
        const codes = (deleted || []).map((row: { short_code: string }) => row.short_code).filter(Boolean);
        const count = codes.length;
        for (let i = 0; i < codes.length; i += 100) {
            try {
                await kv.del(...codes.slice(i, i + 100).map(linkCacheKey));
            } catch (e) {
                console.error('Cleanup: KV delete failed (entries expire on their own):', e);
            }
        }

        return json({
            success: true,
            deleted_count: count,
            message: `Cleaned up ${count} expired guest links.`
        }, 200);

    } catch (error) {
        console.error('Cleanup Error:', error);
        return json({ error: 'Cleanup failed' }, 500);
    }
}
