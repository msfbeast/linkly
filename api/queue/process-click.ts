import { Receiver } from '@upstash/qstash';

export const config = {
    runtime: 'edge',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

// Initialize QStash Receiver
const receiver = new Receiver({
    currentSigningKey: CURRENT_SIGNING_KEY || '',
    nextSigningKey: NEXT_SIGNING_KEY || CURRENT_SIGNING_KEY || '',
});

/**
 * Keyed hash of the visitor IP so raw addresses are never stored. A plain
 * hash of an IPv4 address can be reversed by brute force; HMAC with a
 * server secret cannot.
 */
async function hashIp(rawIp: unknown): Promise<string | null> {
    if (typeof rawIp !== 'string' || !rawIp || rawIp === 'unknown') return null;
    const ip = rawIp.split(',')[0].trim();
    const secret = process.env.IP_HASH_SALT || SUPABASE_KEY || '';
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ip));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // Fail closed: without signing keys we can't tell QStash from anyone else.
    if (!CURRENT_SIGNING_KEY) {
        console.error('QStash signing keys not configured; rejecting click');
        return new Response('Server Configuration Error', { status: 500 });
    }

    const signature = request.headers.get('upstash-signature');
    if (!signature) {
        return new Response('Missing signature', { status: 401 });
    }

    const body = await request.text();
    try {
        const valid = await receiver.verify({ signature, body });
        if (!valid) throw new Error('invalid');
    } catch {
        return new Response('Invalid signature', { status: 401 });
    }

    try {

        const event = JSON.parse(body);

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Supabase not configured');
            return new Response('Server Configuration Error', { status: 500 });
        }

        // 1. Insert into click_events using REST API
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/click_events`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                link_id: event.linkId,
                timestamp: new Date(event.timestamp).toISOString(),
                raw_user_agent: event.userAgent,
                ip_hash: await hashIp(event.ip),
                country: event.country,
                city: event.city,
                region: event.region,
                latitude: event.latitude,
                longitude: event.longitude,
                referrer: event.referrer
            })
        });

        if (!insertRes.ok) {
            console.error('Failed to insert click:', await insertRes.text());
            return new Response('Database Error', { status: 500 });
        }

        // 2. Increment Link Clicks using RPC
        const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_link_clicks`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                link_id: event.linkId,
                clicked_at: new Date(event.timestamp).toISOString()
            })
        });

        if (!rpcRes.ok) {
            // Fallback to simple increment
            await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_clicks`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
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
