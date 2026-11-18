import { afterEach, describe, expect, it } from 'vitest';
import { storageGet, storageRemove, storageSet } from '../safeStorage';

const realLocal = Object.getOwnPropertyDescriptor(window, 'localStorage')!;

describe('safeStorage', () => {
    afterEach(() => {
        Object.defineProperty(window, 'localStorage', realLocal);
        window.localStorage.clear();
    });

    it('reads, writes and removes when storage works', () => {
        storageSet('k', 'v');
        expect(storageGet('k')).toBe('v');
        storageRemove('k');
        expect(storageGet('k')).toBeNull();
        storageSet('s', '1', 'session');
        expect(storageGet('s', 'session')).toBe('1');
    });

    it('never throws when the browser denies storage', () => {
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            get() { throw new DOMException('Access is denied for this document.', 'SecurityError'); },
        });
        expect(() => storageSet('k', 'v')).not.toThrow();
        expect(storageGet('k')).toBeNull();
        expect(() => storageRemove('k')).not.toThrow();
    });
});
