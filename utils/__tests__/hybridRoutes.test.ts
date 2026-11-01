import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isHybridAppRoute, isShortCodePath, shortLinkNavigationPatterns } from '../hybridRoutes';

// Every route path declared in App.tsx, e.g. '/analytics/:id', '/@:handle', '/dashboard/*'.
const appRoutes = [...readFileSync(join(__dirname, '..', '..', 'App.tsx'), 'utf8').matchAll(/["'](\/[^"'\s]*)["']/g)]
    .map(m => m[1])
    .filter(p => p !== '/' && !p.startsWith('/#') && /^\/[@a-z]/.test(p) && !/\.(png|svg|ico|js)$/.test(p));

const concrete = (route: string) => route.replace(/:[a-zA-Z]+/g, 'x').replace(/\*$/, 'x');

describe('isHybridAppRoute (links.trak.in)', () => {
    it('covers every route in App.tsx (a missing one gets "Link not found" on refresh)', () => {
        expect(appRoutes.length).toBeGreaterThan(20);
        for (const route of appRoutes) expect(isHybridAppRoute(concrete(route)), route).toBe(true);
    });

    it('keeps app routes in the app', () => {
        for (const p of ['/', '/store', '/store/abc', '/team', '/team/settings', '/login', '/open/https%3A%2F%2Fx',
            '/p/handle', '/@handle', '/api/r/x', '/unlock/abc', '/go/abc', '/links', '/bio', '/analytics/abc', '/share/tok']) {
            expect(isHybridAppRoute(p), p).toBe(true);
        }
    });

    it('sends short codes that merely start like an app route to the redirect', () => {
        for (const p of ['/storefront', '/openai', '/teamx', '/aboutus', '/goals', '/logins', '/apix', '/linksx', '/abc123']) {
            expect(isHybridAppRoute(p), p).toBe(false);
        }
    });
});

describe('isShortCodePath', () => {
    it('is one segment with no file extension', () => {
        expect(isShortCodePath('/abc')).toBe(true);
        expect(isShortCodePath('/abc/')).toBe(true);
        expect(isShortCodePath('/')).toBe(false);
        expect(isShortCodePath('/assets/index.js')).toBe(false);
        expect(isShortCodePath('/favicon.ico')).toBe(false);
        expect(isShortCodePath('/a/b')).toBe(false);
    });
});

describe('service worker navigation deny-list', () => {
    const denied = (p: string) => shortLinkNavigationPatterns().some(re => re.test(p));
    it('lets short links reach the server', () => {
        for (const p of ['/abc', '/echoapk', '/r/abc', '/storefront']) expect(denied(p), p).toBe(true);
    });
    it('still serves app pages from the cached app', () => {
        for (const p of ['/', '/dashboard', '/links', '/@handle', '/p/x', '/go/abc', '/unlock/abc', '/analytics/x', '/login']) {
            expect(denied(p), p).toBe(false);
        }
    });
});
