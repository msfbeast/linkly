```
// import { Receiver } from '@upstash/qstash';

export const config = {
    runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize QStash Receiver
// const receiver = new Receiver({
//     currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
//     nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
// });

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // const signature = request.headers.get('upstash-signature');
    // if (!signature) {
    //     return new Response('Missing signature', { status: 401 });
    // }

    try {
        const body = await request.text();

        // if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
        //     await receiver.verify({
        //         signature,
        //         body,
        //     });
        // }

        const event = JSON.parse(body);

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Supabase not configured');
            return new Response('Server Configuration Error', { status: 500 });
        }

        // 1. Insert into click_events using REST API
        const insertRes = await fetch(`${ SUPABASE_URL } /rest/v1 / click_events`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${ SUPABASE_KEY } `,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                link_id: event.linkId,
                timestamp: new Date(event.timestamp).toISOString(),
                raw_user_agent: event.userAgent,
                ip_hash: event.ip,
                country: event.country,
                city: event.city,
                region: event.region,
                referrer: event.referrer
            })
        });

        if (!insertRes.ok) {
            console.error('Failed to insert click:', await insertRes.text());
            return new Response('Database Error', { status: 500 });
        }

        // 2. Increment Link Clicks using RPC
        const rpcRes = await fetch(`${ SUPABASE_URL } /rest/v1 / rpc / increment_link_clicks`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${ SUPABASE_KEY } `,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                link_id: event.linkId,
                clicked_at: new Date(event.timestamp).toISOString()
            })
        });

        if (!rpcRes.ok) {
            // Fallback to simple increment
            await fetch(`${ SUPABASE_URL } /rest/v1 / rpc / increment_clicks`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${ SUPABASE_KEY } `,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ link_id: event.linkId })
            });
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
