import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key !== 'debug_secret_123') {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return new Response('Missing credentials', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('click_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

    if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({
        data,
        serviceRoleUsed: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}
