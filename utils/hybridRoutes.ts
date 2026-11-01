/**
 * On links.trak.in the app and short links share one domain: these paths
 * belong to the app, anything else is a short code. Whole path segments
 * only, so '/store' and '/store/x' are app routes but a short code like
 * 'storefront' or 'openai' still redirects. Entries ending in '/' are
 * prefixes ('/p/handle').
 */
export const HYBRID_APP_ROUTES = [
    '/admin', '/dashboard', '/login', '/register',
    '/api', '/assets', '/p/', '/r/', '/store',
    '/open', '/unlock', '/go', '/reset-password', '/update-password',
    '/claim', '/team', '/pricing', '/about', '/privacy', '/terms', '/cookies',
];

export function isHybridAppRoute(pathname: string): boolean {
    return pathname === '/' || HYBRID_APP_ROUTES.some(route =>
        route.endsWith('/')
            ? pathname.startsWith(route)
            : pathname === route || pathname.startsWith(`${route}/`));
}
