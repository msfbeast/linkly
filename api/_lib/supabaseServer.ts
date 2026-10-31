import type { VercelRequest } from '@vercel/node';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Files under api/_lib are not deployed as functions (underscore prefix).

export function getAdminClient(): SupabaseClient | null {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/** Resolve the Supabase user from a `Bearer <jwt>` Authorization header. */
export async function getUserFromRequest(req: VercelRequest): Promise<User | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const admin = getAdminClient();
    if (!admin) return null;
    const { data, error } = await admin.auth.getUser(header.slice('Bearer '.length));
    if (error || !data.user) return null;
    return data.user;
}
