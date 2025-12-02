import { Receiver } from '@upstash/qstash';
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'nodejs', // Use Node.js runtime for full Supabase compatibility
};

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Initialize QStash Receiver for signature verification
const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

export default async function handler(request: Request) {
    // 1. Verify Request Method
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // 2. Verify QStash Signature
    const signature = request.headers.get('upstash-signature');
    if (!signature) {
        return new Response('Missing signature', { status: 401 });
    }

    try {
        const body = await request.text();
        // Verify signature (throws if invalid)
        // Only verify if keys are present (skip in dev if needed, but better to be safe)
        if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
            await receiver.verify({
                signature,
                body,
            });
        }

        const event = JSON.parse(body);

        if (!supabase) {
            console.error('Supabase not configured in worker');
            return new Response('Server Configuration Error', { status: 500 });
        }

        // 3. Insert into Click Events
        const { error: insertError } = await supabase
            .from('click_events')
            .insert({
                link_id: event.linkId,
                timestamp: new Date(event.timestamp).toISOString(),
                raw_user_agent: event.userAgent,
                ip_hash: event.ip, // In real app, hash this!
                country: event.country,
                city: event.city,
                region: event.region,
                referrer: event.referrer,
                // Add other fields as needed
            });

        if (insertError) {
            console.error('Failed to insert click:', insertError);
            return new Response('Database Error', { status: 500 });
        }

        // 4. Increment Link Clicks (RPC)
        const { error: rpcError } = await supabase.rpc('increment_link_clicks', {
            link_id: event.linkId,
            clicked_at: new Date(event.timestamp).toISOString(),
        });

        if (rpcError) {
            // Fallback to manual increment if RPC fails
            await supabase.rpc('increment_clicks', { link_id: event.linkId });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Worker Error:', error);
        return new Response('Invalid Request', { status: 400 });
    }
}
