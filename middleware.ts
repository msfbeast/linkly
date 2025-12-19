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

    // Define allowed domains (localhost and main domain)
    const allowedDomains = ['localhost', 'gather.link', 'app.gather.link', 'gather-link.vercel.app', 'links.trak.in'];
    const isMainDomain = allowedDomains.some(domain => hostname.includes(domain));

    // 0. Rate Limiting - ONLY for custom domains and public redirect routes
    // Skip rate limiting for:
    // - Development environment
    // - Main app domain routes (dashboard, login, etc.) to avoid latency
    // - Only apply to custom domain redirects
    const shouldRateLimit = (
        process.env.NODE_ENV !== 'development' &&
        hostname !== 'localhost' &&
        !isMainDomain // Skip rate limiting for main app - only rate limit custom domains
    );

    if (shouldRateLimit) {
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

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
        .select('user_id, status, target_type')
        .eq('domain', hostname)
        .single();

    if (error || !domainData || domainData.status !== 'active') {
        console.warn(`[Middleware] Domain ${hostname} not found or not active`);
        return next();
    }

    // 2. Determine the route type
    const path = url.pathname;

    // Case A: Root path '/' -> Show Bio Page or Storefront
    if (path === '/') {
        // Check target type (default to 'bio' if not set)
        const targetType = domainData.target_type || 'bio';

        if (targetType === 'store') {
            console.log(`[Middleware] Rewriting ${hostname}/ to /store/${domainData.user_id}`);
            // Rewrite to the storefront page
            // Note: Storefront route is /store/:userId
            url.pathname = `/store/${domainData.user_id}`;
            const response = next();
            response.headers.set('x-middleware-rewrite', url.toString());
            return response;
        } else {
            // Default: Bio Page
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
    }

    // Case B: Short Link '/xyz' -> Rewrite to /r/xyz
    // The existing /r/ page logic handles the lookup by code
    // We just need to ensure the short code exists for this USER (optional security check)
    // We rewrite to /api/r/path to leverage the Edge API and Vercel KV for fast redirects
    if (path.length > 1) {
        console.log(`[Middleware] Rewriting ${hostname}${path} to /api/r${path}`);
        url.pathname = `/api/r${path}`;
        const response = next();
        response.headers.set('x-middleware-rewrite', url.toString());
        return response;
    }

    return next();
}
