
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    // 1. CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        // 2. Authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKey = authHeader.split(' ')[1];

        // Hash the key to verify against DB
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Init Supabase with Service Role Key (Bypass RLS)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Server misconfiguration: Missing Supabase URL or Service Key');
            return new Response(JSON.stringify({ error: 'Server Internal Error' }), { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Verify Key
        const { data: keyData, error: keyError } = await supabase
            .from('api_keys')
            .select('user_id, scopes')
            .eq('key_hash', keyHash)
            .single();

        if (keyError || !keyData) {
            return new Response(JSON.stringify({ error: 'Invalid API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Request Validation
        const body = await request.json();
        const { url, title, tags } = body;

        if (!url) {
            return new Response(JSON.stringify({ error: 'Missing required field: url' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Create Short Link
        // Generate a random short code (6 chars)
        const shortCode = Math.random().toString(36).substring(2, 8);

        const { data: link, error: linkError } = await supabase
            .from('links')
            .insert({
                user_id: keyData.user_id,
                original_url: url,
                short_code: shortCode,
                title: title || new URL(url).hostname,
                tags: tags || [],
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (linkError) {
            console.error('Link creation error:', linkError);
            return new Response(JSON.stringify({ error: 'Failed to create link' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Success Response
        return new Response(JSON.stringify({
            id: link.id,
            shortUrl: `${new URL(request.url).origin}/${link.short_code}`,
            originalUrl: link.original_url,
            createdAt: link.created_at
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
