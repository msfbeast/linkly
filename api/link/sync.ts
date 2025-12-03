import { kv } from '@vercel/kv';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { shortCode, originalUrl, id, password, expiration, start } = await request.json();

        if (!shortCode || !originalUrl) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Write to KV
        // Key: linkly:link:{shortCode}
        // We store id and restrictions for Edge API checks
        await kv.set(`linkly:link:${shortCode}`, {
            url: originalUrl,
            id,
            password,
            expiration,
            start
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Sync API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
