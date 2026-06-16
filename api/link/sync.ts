import { kv } from '@vercel/kv';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method === 'DELETE') {
        try {
            const { shortCode } = await request.json();
            if (!shortCode) {
                return new Response('Missing shortCode', { status: 400 });
            }
            await kv.del(`gather:link:${shortCode}`);
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('Sync DELETE API Error:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
        }
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { shortCode, originalUrl, id, password, expiration, start } = await request.json();

        if (!shortCode || !originalUrl) {
            return new Response('Missing required fields', { status: 400 });
        }

        // Redis Setup for Gather AI:link:{shortCode}
        // We store id and restrictions        // Key: gather:link:{shortCode}
        await kv.set(`gather:link:${shortCode}`, {
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
