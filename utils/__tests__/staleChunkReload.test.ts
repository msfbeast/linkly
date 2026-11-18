import { describe, it, expect, vi } from 'vitest';
import { isStaleChunkError, reloadForStaleChunk } from '../staleChunkReload';
import { isIgnoredError } from '../errorFingerprint';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };

describe('stale chunk reload', () => {
    it('recognises missing-chunk errors from each browser', () => {
        expect(isStaleChunkError('Failed to fetch dynamically imported module: https://links.trak.in/assets/CookieConsent-x.js')).toBe(true);
        expect(isStaleChunkError('Importing a module script failed.')).toBe(true);
        expect(isStaleChunkError('error loading dynamically imported module')).toBe(true);
        expect(isStaleChunkError('Cannot read properties of undefined')).toBe(false);
    });

    it('reloads once a minute at most', () => {
        const store = memory();
        const reload = vi.fn();
        expect(reloadForStaleChunk(1_000_000, store, reload)).toBe(true);
        expect(reloadForStaleChunk(1_030_000, store, reload)).toBe(false);
        expect(reloadForStaleChunk(1_070_000, store, reload)).toBe(true);
        expect(reload).toHaveBeenCalledTimes(2);
    });
});

describe('ignored noise', () => {
    it('drops wallet extensions and Vercel scripts on old webviews', () => {
        expect(isIgnoredError("undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')")).toBe(true);
        expect(isIgnoredError('this.i.at is not a function', 'TypeError\n    at c.l (https://links.trak.in/_vercel/speed-insights/script.js:1:1596)')).toBe(true);
        expect(isIgnoredError('this.i.at is not a function', 'at app.js:1:1')).toBe(false);
    });
});
