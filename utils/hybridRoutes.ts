/**
 * On links.trak.in the app and short links share one domain: these paths
 * belong to the app, single-segment paths outside them are short codes.
 *
 * Keep in sync with the top-level routes in App.tsx:
 * utils/__tests__/hybridRoutes.test.ts fails when one is missing. A missing
 * route gets "Link not found" on a direct visit or refresh (the middleware
 * hands it to the redirect function).
 *
 * Whole path segments only: '/store' and '/store/x' are app routes, but a
 * short code like 'storefront' or 'openai' still redirects.
 */
export const HYBRID_APP_ROUTES = [
    // public
    '/about', '/pricing', '/terms', '/privacy', '/cookies',
    '/login', '/register', '/reset-password', '/update-password',
    '/r', '/go', '/unlock', '/open', '/s', '/p', '/share', '/claim',
    '/store', '/product', '/team',
    // signed in
    '/dashboard', '/settings', '/links', '/bio', '/analytics', '/products',
    '/affiliate', '/affiliate-manager', '/agency', '/api-access', '/admin',
    // not pages, but never short codes
    '/api', '/assets',
];

/** Path prefixes that are app routes within one segment ('/@handle' bio pages). */
export const HYBRID_APP_PREFIXES = ['/@'];

export function isHybridAppRoute(pathname: string): boolean {
    return pathname === '/' ||
        HYBRID_APP_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
        HYBRID_APP_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/** A path that could be a short code: one segment, no file extension. */
export function isShortCodePath(pathname: string): boolean {
    const segment = pathname.replace(/^\/+|\/+$/g, '');
    return segment.length > 0 && !segment.includes('/') && !segment.includes('.');
}

/**
 * For the service worker: navigations it must NOT answer with the cached app,
 * so short links reach the server redirect (/r/code and bare /code that
 * isn't an app route).
 */
export function shortLinkNavigationPatterns(): RegExp[] {
    const names = HYBRID_APP_ROUTES.map(r => r.slice(1).replace(/[-]/g, '\\-')).join('|');
    return [
        /^\/r\/[^/]+\/?$/,
        new RegExp(`^/(?!(?:${names})(?:/|$))(?!@)[^/.]+/?$`),
    ];
}
