import { describe, it, expect } from 'vitest';
import { getAppDeepLink } from '../appDeepLinking';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';

/**
 * AFFILIATE-CRITICAL REGRESSION TESTS
 * A previous version of getAppDeepLink converted Amazon links to an
 * ASIN-only scheme and Flipkart links to a pid-only scheme, silently
 * dropping ?tag= / ?affid= and destroying affiliate attribution.
 * These tests exist to make sure that never happens again.
 */
describe('getAppDeepLink affiliate tag preservation', () => {
    const amazonUrl = 'https://www.amazon.in/dp/B0EXAMPLE1?tag=trak-21';
    const flipkartUrl = 'https://www.flipkart.com/product/p/itmabc123?affid=trakaff';

    it('preserves the Amazon associate tag on iOS', () => {
        const link = getAppDeepLink(amazonUrl, IOS_UA);
        expect(link).toBeTruthy();
        // The full tagged URL must survive (encoded) inside the deep link
        expect(link!).toContain(encodeURIComponent('tag=trak-21'));
    });

    it('preserves the Amazon associate tag on Android', () => {
        const link = getAppDeepLink(amazonUrl, ANDROID_UA);
        expect(link).toBeTruthy();
        expect(link!).toContain('tag=trak-21');
    });

    it('never emits the ASIN-only Amazon scheme that drops the query string', () => {
        const iosLink = getAppDeepLink(amazonUrl, IOS_UA);
        expect(iosLink!).not.toMatch(/com\.amazon\.mobile\.shopping:\/\/[^?]*\/products\//);
    });

    it('preserves the Flipkart affiliate id on iOS', () => {
        const link = getAppDeepLink(flipkartUrl, IOS_UA);
        expect(link).toBeTruthy();
        expect(link!).toContain(encodeURIComponent('affid=trakaff'));
    });

    it('preserves the Flipkart affiliate id on Android', () => {
        const link = getAppDeepLink(flipkartUrl, ANDROID_UA);
        expect(link).toBeTruthy();
        expect(link!).toContain('affid=trakaff');
    });

    it('never emits the pid-only Flipkart scheme that drops the query string', () => {
        const iosLink = getAppDeepLink(flipkartUrl, IOS_UA);
        expect(iosLink!).not.toContain('flipkart://product?pid=');
    });
});
