import { describe, it, expect } from 'vitest';
import { parseUrlList, sortProducts } from '../productList';
import { newShortCode } from '../shortCode';
import { Product } from '../../types';

describe('parseUrlList', () => {
    it('splits on lines, spaces and commas and adds https', () => {
        expect(parseUrlList('https://a.com/x\namazon.in/dp/B0, flipkart.com/p  https://c.org')).toEqual([
            'https://a.com/x', 'https://amazon.in/dp/B0', 'https://flipkart.com/p', 'https://c.org/',
        ]);
    });
    it('drops duplicates, words and other schemes', () => {
        expect(parseUrlList('hello https://a.com/x https://a.com/x javascript:alert(1) ftp://f.com/a')).toEqual(['https://a.com/x']);
    });
    it('strips surrounding punctuation', () => {
        expect(parseUrlList('(https://a.com/x).')).toEqual(['https://a.com/x']);
    });
    it('stops at the limit', () => {
        const text = Array.from({ length: 30 }, (_, i) => `https://s${i}.com`).join('\n');
        expect(parseUrlList(text, 25)).toHaveLength(25);
    });
});

describe('sortProducts', () => {
    const p = (id: string, createdAt: number, position?: number | null): Product =>
        ({ id, userId: 'u', name: id, description: '', price: 0, currency: 'INR', createdAt, position });
    it('puts never-arranged products first, newest first, then the saved order', () => {
        const list = [p('a', 1, 1), p('b', 2, 0), p('new', 9), p('newer', 10, null), p('c', 3, 2)];
        expect(sortProducts(list).map(x => x.id)).toEqual(['newer', 'new', 'b', 'a', 'c']);
    });
    it('does not change the input', () => {
        const list = [p('a', 1, 1), p('b', 2, 0)];
        sortProducts(list);
        expect(list.map(x => x.id)).toEqual(['a', 'b']);
    });
});

describe('newShortCode', () => {
    it('makes 7 unambiguous characters by default', () => {
        for (let i = 0; i < 50; i++) expect(newShortCode()).toMatch(/^[a-hjkmnp-z2-9]{7}$/);
    });
    it('does not repeat in practice', () => {
        const codes = new Set(Array.from({ length: 2000 }, () => newShortCode()));
        expect(codes.size).toBe(2000);
    });
});
