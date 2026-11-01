import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../userAgent';

describe('parseUserAgent', () => {
    it.each([
        ['Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', 'Mobile', 'Android', 'Chrome'],
        ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', 'Mobile', 'iOS', 'Safari'],
        ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1', 'Tablet', 'iOS', 'Chrome'],
        ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0', 'Desktop', 'Windows 10', 'Edge'],
        ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'Desktop', 'MacOS', 'Safari'],
        ['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'Desktop', 'Linux', 'Firefox'],
    ])('%s', (ua, device, os, browser) => {
        expect(parseUserAgent(ua)).toEqual({ device, os, browser });
    });

    it('handles a missing user agent', () => {
        expect(parseUserAgent(null)).toEqual({ device: 'Desktop', os: 'Unknown', browser: 'Unknown' });
    });
});
