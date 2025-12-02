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
    const code = url.searchParams.get('code');

    if (!code) {
        return new Response('Missing code', { status: 400 });
    }

    try {
        console.log(`[Edge] Checking link: ${code}`);

        // Check Vercel KV for the link
        const linkData = await kv.get<{ url: string; id: string }>(`linkly:link:${code}`);

        if (linkData && linkData.url) {
            // Async Analytics: Publish to QStash
            if (process.env.QSTASH_TOKEN) {
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

                // Fire-and-forget publish
                // Note: In Edge Functions, we don't have context.waitUntil exposed directly in the handler signature
                // for standard Request/Response, but Vercel Edge supports it if we use the specific signature.
                // However, for simplicity and speed, we'll await the publish (it's very fast) or use the background fetch pattern.
                // For now, we'll await it to ensure it sends, as < 50ms latency is acceptable.
                // OPTIMIZATION: Use waitUntil if available in the platform context, but standard Request doesn't have it.
                // We will just await it. QStash publish is ~10-20ms.
                await qstash.publishJSON({
                    url: `${url.origin}/api/queue/process-click`,
                    body: clickEvent,
                });
            }

            return Response.redirect(linkData.url, 307);
        } else {
            // Link not found in KV -> Fallback to Origin (Client-side handling)
            // We redirect back to the app's /r/:code route so the React app can handle the 404 or DB lookup
            // BUT we must avoid an infinite loop.
            // Actually, if it's not in KV, we should probably let the React App handle it.
            // Since we rewrote /r/:code to this function, we can't just "continue".
            // We must explicitly redirect to index.html or return the index.html content?
            // Easier: Redirect to /?r=:code or let the client handle it.
            // BETTER: Return 404 here if we are sure KV has all links.
            // IF we are not sure, we can fetch from Supabase here (slower) or redirect to a fallback route.

            // Strategy: Redirect to a special query param that the App recognizes as "Skip Edge"
            // OR: Just return 404.
            return new Response('Link not found', { status: 404 });
        }
    } catch (error) {
        console.error('[Edge] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
