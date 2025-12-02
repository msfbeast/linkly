import { kv } from '@vercel/kv';
import { Client } from '@upstash/qstash';
import { next } from '@vercel/edge';

export const config = {
    matcher: '/r/:path*',
};

// Initialize QStash Client
const qstash = new Client({
    token: process.env.QSTASH_TOKEN || '',
});

export default async function middleware(request: Request, context: { waitUntil: (promise: Promise<any>) => void }) {
    console.log('[Middleware] Executing for URL:', request.url);

    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle /r/ shortlinks
    if (path.startsWith('/r/')) {
        const code = path.split('/r/')[1];
        if (code) {
            try {
                console.log(`[Middleware] Checking link: ${code}`);
                console.log(`[Middleware] KV URL Configured: ${!!process.env.KV_REST_API_URL}`);

                // Check Vercel KV for the link
                // Key format: linkly:link:{code}
                const linkData = await kv.get<{ url: string; id: string }>(`linkly:link:${code}`);

                console.log(`[Middleware] Lookup result for ${code}:`, linkData ? 'Found' : 'Null');

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

                        const publishPromise = qstash.publishJSON({
                            url: `${url.origin}/api/queue/process-click`,
                            body: clickEvent,
                        });

                        context.waitUntil(publishPromise);
                    }

                    // Return 307 Temporary Redirect
                    return Response.redirect(linkData.url, 307);
                }
            } catch (error) {
                console.error('Middleware KV Error:', error);
            }
        }
    }

    // Continue to origin if no redirect happened
    return next();
}
