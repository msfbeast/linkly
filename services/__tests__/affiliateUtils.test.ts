import { describe, it, expect, vi } from 'vitest';
import { monetizeUrl, isShortAmazonUrl, resolveShortUrl, resolveShortUrlBackend } from '../../utils/affiliateUtils';

describe('Affiliate Monetization Utilities', () => {
    describe('isShortAmazonUrl', () => {
        it('should detect amzn.to URLs', () => {
            expect(isShortAmazonUrl('https://amzn.to/3Xyz123')).toBe(true);
            expect(isShortAmazonUrl('http://amzn.to/abc')).toBe(true);
        });

        it('should detect amzn.in URLs', () => {
            expect(isShortAmazonUrl('https://amzn.in/d/456abc')).toBe(true);
        });

        it('should detect amazon.in /d/ URLs', () => {
            expect(isShortAmazonUrl('https://www.amazon.in/d/123456')).toBe(true);
            expect(isShortAmazonUrl('https://amazon.in/d/123456')).toBe(true);
        });

        it('should return false for regular Amazon URLs', () => {
            expect(isShortAmazonUrl('https://www.amazon.in/dp/B0CHX1W1XY')).toBe(false);
            expect(isShortAmazonUrl('https://amazon.com/gp/product/B0CHX1W1XY')).toBe(false);
        });

        it('should return false for non-Amazon URLs', () => {
            expect(isShortAmazonUrl('https://google.com')).toBe(false);
            expect(isShortAmazonUrl('https://flipkart.com')).toBe(false);
        });
    });

    describe('monetizeUrl', () => {
        const config = {
            amazonAssociateTag: 'myamazon-21',
            flipkartAffiliateId: 'myflipkartid',
        };

        it('should monetize Flipkart URLs with pid/itm', () => {
            const url = 'https://www.flipkart.com/product/p/itm123456?pid=itm123456';
            const result = monetizeUrl(url, config);
            expect(result).toBe('https://www.flipkart.com/product/p/itm123456?affid=myflipkartid');
        });

        it('should monetize Amazon com/in URLs with ASIN', () => {
            const url = 'https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY/ref=sr_1_3';
            const result = monetizeUrl(url, config);
            expect(result).toBe('https://amazon.in/dp/B0CHX1W1XY?tag=myamazon-21');
        });

        it('should append tag as fallback if no ASIN/itm found', () => {
            const url = 'https://www.amazon.in/some-other-page';
            const result = monetizeUrl(url, config);
            expect(result).toContain('tag=myamazon-21');
        });

        it('should ignore non-monetized sites', () => {
            const url = 'https://google.com';
            const result = monetizeUrl(url, config);
            expect(result).toBe(url);
        });
    });

    describe('resolveShortUrl', () => {
        it('should bypass resolve if not short Amazon URL', async () => {
            const result = await resolveShortUrl('https://google.com');
            expect(result).toBe('https://google.com');
        });

        it('should fetch from internal proxy resolve endpoint', async () => {
            const mockUrl = 'https://amzn.to/3Xyz123';
            const mockResolved = 'https://www.amazon.in/dp/B0CHX1W1XY';

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ url: mockResolved }),
            });

            const result = await resolveShortUrl(mockUrl);
            expect(global.fetch).toHaveBeenCalledWith(`/api/link/resolve?url=${encodeURIComponent(mockUrl)}`);
            expect(result).toBe(mockResolved);
        });
    });

    describe('resolveShortUrlBackend', () => {
        it('should fetch directly and follow redirects', async () => {
            const mockUrl = 'https://amzn.to/3Xyz123';
            const mockResolved = 'https://www.amazon.in/dp/B0CHX1W1XY';

            global.fetch = vi.fn().mockResolvedValue({
                url: mockResolved,
            });

            const result = await resolveShortUrlBackend(mockUrl);
            expect(global.fetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
                redirect: 'follow',
            }));
            expect(result).toBe(mockResolved);
        });
    });
});
