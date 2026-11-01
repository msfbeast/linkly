import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';
import { linkCacheKey } from '../_lib/linkCache';

// Initialize Supabase Client (Server-side)
// Note: In a real Vercel function, we'd use process.env
// For this client-side demo code, we'll simulate the logic.

export default async function handler(req: any, res: any) {
    // 1. Verify Cron Secret. Fail closed when it isn't set: comparing against
    // `Bearer ${undefined}` would accept the literal header "Bearer undefined".
    const secret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'];
    if (!secret || authHeader !== `Bearer ${secret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs service role for deletion
    const supabase = createClient(supabaseUrl, supabaseKey);

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

        return res.status(200).json({
            success: true,
            deleted_count: count,
            message: `Cleaned up ${count} expired guest links.`
        });

    } catch (error: any) {
        console.error('Cleanup Error:', error);
        return res.status(500).json({ error: 'Cleanup failed' });
    }
}
