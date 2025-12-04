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
        console.error(`[Edge API] QSTASH_TOKEN present: ${!!process.env.QSTASH_TOKEN}`);

        // Check Vercel KV for the link
        const linkData = await kv.get<{
            url: string;
            id: string;
            password?: boolean;
            expiration?: number;
            start?: number;
        }>(`linkly:link:${code}`);

        if (linkData && linkData.url) {
            // Async Analytics: Publish to QStash
            try {
                const rawCity = request.headers.get('x-vercel-ip-city');
                const decodedCity = rawCity ? decodeURIComponent(rawCity) : null;

                const clickEvent = {
                    linkId: linkData.id,
                    timestamp: Date.now(),
                    userAgent: request.headers.get('user-agent'),
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    referrer: request.headers.get('referer'),
                    country: request.headers.get('x-vercel-ip-country'),
                    city: decodedCity,
                    region: request.headers.get('x-vercel-ip-region'),
                    latitude: request.headers.get('x-vercel-ip-latitude'),
                    longitude: request.headers.get('x-vercel-ip-longitude'),
                };

                console.log('[Edge API] Sending to QStash via fetch...');

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkly-ai.vercel.app';
                const qstashRes = await fetch(`${process.env.QSTASH_URL}/v2/publish/${appUrl}/api/queue/process-click`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(clickEvent),
                });

                if (!qstashRes.ok) {
                    console.error(`[Edge API] QStash failed: ${qstashRes.status} ${await qstashRes.text()}`);
                } else {
                    console.log(`[Edge API] QStash success: ${await qstashRes.text()}`);
                }
            } catch (qError) {
                console.error('[Edge API] QStash Error:', qError);
                // Don't fail the redirect if analytics fails
            }

            // 1. Check Restrictions (Password, Expiration, Start Date)
            const now = Date.now();
            if (linkData.password ||
                (linkData.expiration && now > linkData.expiration) ||
                (linkData.start && now < linkData.start)) {
                console.log(`[Edge API] Link has restrictions, delegating to React Page: ${code}`);
                // Redirect to the React Page which handles UI for passwords/errors
                // We use the same path /r/[code] but without the /api prefix
                // The middleware rewrites /r/[code] to /api/r/[code], so we need to be careful not to loop.
                // Wait, if we redirect to /r/[code], the middleware sees it.
                // If it's a custom domain, middleware rewrites /r/[code] to /api/r/[code].
                // LOOP DANGER!

                // SOLUTION: We need to tell the middleware NOT to rewrite this request.
                // Or, we redirect to the main domain?
                // If we redirect to app.linkly.ai/r/[code], it works.
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkly-ai.vercel.app';
                return Response.redirect(`${appUrl}/r/${code}`, 307);
            }

            // Smart Redirect for Mobile Users (to break out of in-app browsers)
            const userAgent = request.headers.get('user-agent') || '';
            const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

            if (isMobile) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkly-ai.vercel.app';
                const encodedTarget = encodeURIComponent(linkData.url);
                return Response.redirect(`${appUrl}/open/${encodedTarget}`, 307);
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
