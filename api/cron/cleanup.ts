import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Server-side)
// Note: In a real Vercel function, we'd use process.env
// For this client-side demo code, we'll simulate the logic.

export default async function handler(req: any, res: any) {
    // 1. Verify Cron Secret
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Needs service role for deletion
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 2. Delete Expired Guest Links
        const { count, error } = await supabase
            .from('links')
            .delete({ count: 'exact' })
            .eq('is_guest', true)
            .lt('expires_at', new Date().toISOString());

        if (error) throw error;

        return res.status(200).json({
            success: true,
            deleted_count: count,
            message: `Cleaned up ${count} expired guest links.`
        });

    } catch (error: any) {
        console.error('Cleanup Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
