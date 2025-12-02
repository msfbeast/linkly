import { kv } from '@vercel/kv';
import { Client } from '@upstash/qstash';

export const config = {
    runtime: 'edge',
};

// Initialize QStash Client
const qstash = new Client({
    token: process.env.QSTASH_TOKEN || '',
});

export default async function handler(request: Request) {
    const url = new URL(request.url);
    // Vercel file-system routing: /api/r/[code]
    // The code is usually passed as a query param or part of the path depending on how we access it.
    // If we rewrite /r/:code -> /api/r/[code], Vercel passes it.
    // Let's try to parse from URL path first, or query param.

    // When accessed via rewrite /r/foo -> /api/r/foo
    // The request.url might still be /r/foo or /api/r/foo depending on Vercel internal proxy.
    // Safer to parse the last segment.

    const pathSegments = url.pathname.split('/');
    const code = pathSegments[pathSegments.length - 1];

    if (!code) {
        return new Response('Missing code', { status: 400 });
    }

    try {
        console.log(`[Edge API] Checking link: ${code}`);

        // Check Vercel KV for the link
        const linkData = await kv.get<{ url: string; id: string }>(`linkly:link:${code}`);

        if (linkData && linkData.url) {
            // Async Analytics: Publish to QStash
            if (process.env.QSTASH_TOKEN) {
                try {
                    const clickEvent = {
                        linkId: linkData.id,
                        timestamp: Date.now(),
                        userAgent: request.headers.get('user-agent'),
                        ip: request.headers.get('x-forwarded-for') || 'unknown',
                        referrer: request.headers.get('referer'),
                        country: request.headers.get('x-vercel-ip-country'),
                        city: request.headers.get('x-vercel-ip-city'),
                        region: request.headers.get('x-vercel-ip-region'),
                    };

                    await qstash.publishJSON({
                        url: `https://linkly-ai.vercel.app/api/queue/process-click`,
                        body: clickEvent,
                    });
                } catch (qError) {
                    console.error('[Edge API] QStash Error:', qError);
                    // Don't fail the redirect if analytics fails
                }
            }

            return Response.redirect(linkData.url, 307);
        } else {
            return new Response('Link not found', { status: 404 });
        }
    } catch (error) {
        console.error('[Edge API] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
