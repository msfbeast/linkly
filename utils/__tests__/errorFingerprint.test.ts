import { describe, it, expect } from 'vitest';
import { cleanPath, errorFingerprint, isIgnoredError, normaliseForGrouping } from '../errorFingerprint';

describe('error grouping', () => {
    it('groups the same error across bundle hashes, numbers and ids', async () => {
        const a = await errorFingerprint('browser', 'Cannot read properties of undefined (reading 42)',
            'TypeError: x\n    at render (https://links.trak.in/assets/Dashboard-AbC12345.js:10:20)');
        const b = await errorFingerprint('browser', 'Cannot read properties of undefined (reading 7)',
            'TypeError: x\n    at render (https://links.trak.in/assets/Dashboard-ZyX98765.js:11:3)');
        expect(a).toBe(b);
        expect(a).toMatch(/^[0-9a-f]{32}$/);
    });
    it('keeps errors from different places or sources apart', async () => {
        const a = await errorFingerprint('browser', 'boom', '    at one (https://x/assets/a.js:1:1)');
        const b = await errorFingerprint('browser', 'boom', '    at two (https://x/assets/a.js:1:1)');
        const c = await errorFingerprint('server', 'boom', '    at one (https://x/assets/a.js:1:1)');
        expect(new Set([a, b, c]).size).toBe(3);
    });
    it('replaces uuids', () => {
        expect(normaliseForGrouping('link 1f2be9bc-e46f-4788-bac4-9d76bc006c5a missing')).toBe('link <uuid> missing|');
    });
});

describe('isIgnoredError', () => {
    it('drops noise we cannot act on', () => {
        expect(isIgnoredError('ResizeObserver loop completed with undelivered notifications.')).toBe(true);
        expect(isIgnoredError('Script error.')).toBe(true);
        expect(isIgnoredError('x', 'at f (chrome-extension://abc/content.js:1:1)')).toBe(true);
        expect(isIgnoredError('TypeError: Load failed')).toBe(true);
        expect(isIgnoredError('Cannot read properties of undefined')).toBe(false);
    });
});

describe('cleanPath', () => {
    it('keeps only the path', () => {
        expect(cleanPath('https://links.trak.in/claim/tok?email=a@b.com#x')).toBe('/claim/tok');
        expect(cleanPath('/dashboard?x=1')).toBe('/dashboard');
        expect(cleanPath(null)).toBe('');
    });
});
