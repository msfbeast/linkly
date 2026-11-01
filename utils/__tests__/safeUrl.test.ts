import { describe, it, expect } from 'vitest';
import { safeWebUrl, safeNavigationUrl } from '../safeUrl';

const SCRIPT_URLS = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    '\u0001javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'jav&#x09;ascript:alert(1)'.replace('&#x09;', '\t'),
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://gather.link/uuid',
];

describe('safeNavigationUrl', () => {
    it.each(SCRIPT_URLS)('blocks %j', (u) => {
        expect(safeNavigationUrl(u)).toBeNull();
    });

    it('allows web links, app links and intents', () => {
        expect(safeNavigationUrl('https://amazon.in/dp/B0?tag=x')).toBe('https://amazon.in/dp/B0?tag=x');
        expect(safeNavigationUrl('instagram://user?username=gather')).toBe('instagram://user?username=gather');
        expect(safeNavigationUrl('intent://open#Intent;scheme=https;package=com.x;end')).toMatch(/^intent:/);
        expect(safeNavigationUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    });

    it('treats a scheme-less address as https, and rejects junk', () => {
        expect(safeNavigationUrl('example.com/page')).toBe('https://example.com/page');
        expect(safeNavigationUrl('')).toBeNull();
        expect(safeNavigationUrl(null)).toBeNull();
        expect(safeNavigationUrl(42)).toBeNull();
    });
});

describe('safeWebUrl', () => {
    it.each([...SCRIPT_URLS, 'instagram://user', 'intent://x#Intent;end', 'mailto:a@b.c'])('rejects %j', (u) => {
        expect(safeWebUrl(u)).toBeNull();
    });

    it('allows http(s)', () => {
        expect(safeWebUrl('https://gather.link/x')).toBe('https://gather.link/x');
        expect(safeWebUrl('http://example.com')).toBe('http://example.com/');
        expect(safeWebUrl('example.com')).toBe('https://example.com/');
    });
});
