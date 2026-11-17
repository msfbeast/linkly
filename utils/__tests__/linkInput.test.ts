import { describe, it, expect } from 'vitest';
import { checkShortCode, cleanDestination, isValidShortCode } from '../linkInput';

describe('cleanDestination', () => {
    it('adds https:// and drops a pasted title', () => {
        expect(cleanDestination('amazon.in/dp/B0')).toBe('https://amazon.in/dp/B0');
        expect(cleanDestination('Folo – https://play.google.com/x?id=1')).toBe('https://play.google.com/x?id=1');
    });
    it('keeps bio widgets', () => {
        expect(cleanDestination('widget://tip_jar')).toBe('widget://tip_jar');
    });
    it('refuses what is not a web address', () => {
        for (const bad of ['me@gmail.com', 'javascript:alert(1)', 'two words', '', null]) {
            expect(() => cleanDestination(bad)).toThrow(/web address/);
        }
    });
});

describe('short codes', () => {
    it('allow letters, digits, - and _', () => {
        expect(isValidShortCode('oppo-find_x8')).toBe(true);
        expect(checkShortCode('abc123')).toBe('abc123');
    });
    it('refuse spaces, slashes, empty and over-long codes', () => {
        for (const bad of ['Kiribati ', 'oppo find', 'a/b', '', 'x'.repeat(65), 'https://links.trak.in/x']) {
            expect(isValidShortCode(bad)).toBe(false);
        }
        expect(() => checkShortCode('a b')).toThrow(/letters, numbers/);
    });
});
