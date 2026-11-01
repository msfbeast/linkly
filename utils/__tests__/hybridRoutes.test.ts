import { describe, it, expect } from 'vitest';
import { isHybridAppRoute } from '../hybridRoutes';

describe('isHybridAppRoute (links.trak.in)', () => {
    it('keeps app routes in the app', () => {
        for (const p of ['/', '/store', '/store/abc', '/team', '/team/settings', '/login', '/open/https%3A%2F%2Fx', '/p/handle', '/api/r/x', '/unlock/abc', '/go/abc']) {
            expect(isHybridAppRoute(p), p).toBe(true);
        }
    });

    it('sends short codes that merely start like an app route to the redirect', () => {
        for (const p of ['/storefront', '/openai', '/teamx', '/aboutus', '/goals', '/logins', '/apix', '/p', '/abc123']) {
            expect(isHybridAppRoute(p), p).toBe(false);
        }
    });
});
