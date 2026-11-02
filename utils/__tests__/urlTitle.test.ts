import { describe, it, expect } from 'vitest';
import { titleFromUrl } from '../urlTitle';

describe('titleFromUrl', () => {
    it('derives a readable title from an e-commerce slug', () => {
        const t = titleFromUrl('https://www.flipkart.com/nothing-phone-2026-coming-soon-store/p/itmf0e22718af1ed?pid=PWBHK');
        expect(t).toContain('Nothing Phone 2026');
        expect(t).toContain('Flipkart');
    });

    it('handles Amazon dp URLs by skipping the opaque ASIN', () => {
        const t = titleFromUrl('https://www.amazon.in/dp/B0EXAMPLE1?tag=trak-21');
        expect(t).toBe('Amazon'); // no slug — brand fallback
    });

    it('names Play Store apps from their package id', () => {
        expect(titleFromUrl('https://play.google.com/store/apps/details?id=com.fitbit.FitbitMobile')).toBe('FitbitMobile · Google Play');
        expect(titleFromUrl('https://play.google.com/store/apps/details?id=ai.x.grok')).toBe('Grok · Google Play');
        expect(titleFromUrl('https://play.google.com/store/apps')).toBe('Google Play');
    });

    it('reads addresses pasted without https://', () => {
        expect(titleFromUrl('amazon.in/HyperX-Controlled-Customization-Programmable-Buttons-Black/dp/B07H3GFJJ2/ref=sr_1_1')).toContain('Hyperx Controlled');
        expect(titleFromUrl('henah1496@gmail.coam')).toBe('Untitled Link');
    });

    it('skips Blinkit product ids and Amazon short links', () => {
        expect(titleFromUrl('https://blinkit.com/prn/x/prid/700712')).toBe('Blinkit');
        expect(titleFromUrl('https://amzn.in/d/0c97RfJm')).toBe('Amazon Product');
    });

    it('skips placeholder segments like /product/', () => {
        expect(titleFromUrl('https://www.flipkart.com/product/p/itmf733f99c22ee6?affid=x')).toBe('Flipkart');
    });

    it('uses friendly names for known opaque hosts', () => {
        expect(titleFromUrl('https://docs.google.com/document/d/1k197sacWEKV-DMsX0GE_vA055mO7nj/edit')).toBe('Google Docs');
        expect(titleFromUrl('https://drive.google.com/drive/folders/1jtoqFm_pRuCFzXcvgFe')).toBe('Google Drive');
        expect(titleFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('YouTube Video');
    });

    it('never returns "New Link"', () => {
        const urls = [
            'https://example.com',
            'https://example.com/some-product',
            'not a url at all',
            'https://x.io/9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c',
        ];
        for (const url of urls) {
            expect(titleFromUrl(url)).not.toBe('New Link');
            expect(titleFromUrl(url).length).toBeGreaterThan(0);
        }
    });

    it('truncates very long slugs', () => {
        const t = titleFromUrl('https://shop.example.com/' + 'very-'.repeat(30) + 'long-product-name');
        expect(t.length).toBeLessThan(80);
    });
});
