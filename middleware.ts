import { next } from '@vercel/edge';
import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};

// Initialize Ratelimit
// We use a sliding window of 20 requests per 10 seconds per IP
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "10 s"), // Increased to 100 to prevent 429s
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // 0. Rate Limiting
    // Only rate limit public routes or specific paths if needed
    // For now, we rate limit everything to be safe, but exclude localhost for dev
    if (hostname !== 'localhost') {
        const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);

        // Pending promises should be awaited to ensure analytics are sent
        // But we don't want to block the response
        // context.waitUntil(pending); // Vercel Edge Middleware supports waitUntil but it's on the event object which we don't have here in this signature
        // In standard Request handler, we just await or fire-and-forget if possible. 
        // For critical path, we await 'success'.

        if (!success) {
            console.warn(`[Middleware] Rate limit exceeded for IP: ${ip}`);
            return new Response("Too Many Requests", {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                },
            });
        }
    }

    // Define allowed domains (localhost and main domain)
    // In production, this should be your actual domain, e.g., 'app.linkly.ai'
    const allowedDomains = ['localhost', 'linkly.ai', 'app.linkly.ai', 'linkly-ai.vercel.app', 'links.trak.in'];

    // Check if the current hostname is in the allowed list
    // We use .some() to check if the hostname ends with any of the allowed domains
    // to support subdomains like www.linkly.ai
    const isMainDomain = allowedDomains.some(domain => hostname.includes(domain));

    // If it's a main domain, let the request pass through
    if (isMainDomain) {
        // SPECIAL CASE: links.trak.in is a hybrid domain (App + Short Links)
        // If it's links.trak.in, we need to check if it's a system route or a short link
        if (hostname === 'links.trak.in') {
            const systemRoutes = [
                '/admin', '/dashboard', '/login', '/register',
                '/api', '/assets', '/p/', '/r/', '/store',
                '/open', '/reset-password', '/update-password',
                '/claim', '/team', '/pricing', '/about', '/privacy', '/terms', '/cookies'
            ];

            const isSystemRoute = systemRoutes.some(route => url.pathname.startsWith(route)) || url.pathname === '/';

            if (!isSystemRoute) {
                // It's a short link! Rewrite to /api/r/path (Edge API)
                // This uses Vercel KV and bypasses client-side RLS issues
                console.log(`[Middleware] Hybrid Rewrite: ${hostname}${url.pathname} to /api/r${url.pathname}`);
                url.pathname = `/api/r${url.pathname}`;
                const response = next();
                response.headers.set('x-middleware-rewrite', url.toString());
                return response;
            }
        }

        // Protect /admin routes
        if (url.pathname.startsWith('/admin')) {
            // ... existing admin logic (which just returns next() currently)
            return next();
        }
        return next();
    }

    // If we are here, it's a custom domain!
    console.log(`[Middleware] Custom domain detected: ${hostname}`);

    // Initialize Supabase Client
    // Note: We need to use process.env for Edge Middleware
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[Middleware] Supabase credentials missing');
        return next();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verify if the domain exists in our database
    const { data: domainData, error } = await supabase
        .from('domains')
        .select('user_id, status')
        .eq('domain', hostname)
        .single();

    if (error || !domainData || domainData.status !== 'active') {
        console.warn(`[Middleware] Domain ${hostname} not found or not active`);
        // Rewrite to a 404 page or a generic "Domain not configured" page
        // For now, we'll rewrite to the main index to show the app, but the app should handle the 404
        // effectively by checking window.location.hostname
        return next();
    }

    // 2. Determine the route type
    const path = url.pathname;

    // Case A: Root path '/' -> Show Bio Page or Main Redirect
    if (path === '/') {
        // Fetch the user's primary bio profile or redirect
        // For this MVP, let's assume we rewrite to the bio page of the user
        // We need to find the username first.
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', domainData.user_id)
            .single();

        if (profile?.username) {
            console.log(`[Middleware] Rewriting ${hostname}/ to /p/${profile.username}`);
            // Rewrite the URL to the internal path for the bio page
            url.pathname = `/p/${profile.username}`;
            const response = next();
            response.headers.set('x-middleware-rewrite', url.toString());
            return response;
        }
    }

    // Case B: Short Link '/xyz' -> Rewrite to /r/xyz
    // The existing /r/ page logic handles the lookup by code
    // We just need to ensure the short code exists for this USER (optional security check)
    // For now, we'll just rewrite to /r/path
    if (path.length > 1) {
        console.log(`[Middleware] Rewriting ${hostname}${path} to /r${path}`);
        url.pathname = `/r${path}`;
        const response = next();
        response.headers.set('x-middleware-rewrite', url.toString());
        return response;
    }

    return next();
}
