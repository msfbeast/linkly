import { describe, it, expect } from 'vitest';
import { storeLook, productCategories, filterProducts, productHref } from '../storePage';
import { Product } from '../../types';

const product = (over: Partial<Product>): Product => ({
    id: 'p', userId: 'u', name: 'Thing', description: '', price: 1, currency: 'INR', createdAt: 0, ...over,
});

describe('storeLook', () => {
    it('keeps the two real looks', () => {
        expect(storeLook('light')).toBe('light');
        expect(storeLook('dark')).toBe('dark');
    });
    it('maps legacy themes, defaulting to light', () => {
        expect(storeLook('cyberpunk')).toBe('dark');
        expect(storeLook('industrial')).toBe('dark');
        expect(storeLook('vibrant')).toBe('light');
        expect(storeLook('something-new')).toBe('light');
        expect(storeLook(null)).toBe('light');
    });
});

describe('productCategories', () => {
    it('lists distinct categories once, ignoring case and blanks', () => {
        const list = [product({ category: 'Phones' }), product({ category: ' phones ' }), product({ category: '' }), product({}), product({ category: 'Audio' })];
        expect(productCategories(list)).toEqual(['Phones', 'Audio']);
    });
});

describe('filterProducts', () => {
    const list = [
        product({ id: 'a', name: 'OnePlus 15', category: 'Phones' }),
        product({ id: 'b', name: 'Buds', description: 'wireless earbuds', category: 'Audio' }),
        product({ id: 'c', name: 'Cable' }),
    ];
    it('returns everything with no filter', () => {
        expect(filterProducts(list, null, '  ')).toHaveLength(3);
    });
    it('filters by category, ignoring case', () => {
        expect(filterProducts(list, 'audio', '').map(p => p.id)).toEqual(['b']);
    });
    it('searches name, description and category', () => {
        expect(filterProducts(list, null, 'EARBUDS').map(p => p.id)).toEqual(['b']);
        expect(filterProducts(list, null, 'phones').map(p => p.id)).toEqual(['a']);
        expect(filterProducts(list, 'Phones', 'buds')).toEqual([]);
    });
});

describe('productHref', () => {
    const codes = new Map([['link-1', 'abc']]);
    it('goes through the short link when there is one', () => {
        expect(productHref(product({ linkId: 'link-1', originalUrl: 'https://shop.example/x' }), codes)).toBe('/r/abc');
        expect(productHref(product({ shortCode: 'own' }), codes)).toBe('/r/own');
    });
    it('falls back to the seller URL', () => {
        expect(productHref(product({ linkId: 'missing', originalUrl: 'https://shop.example/x' }), codes)).toBe('https://shop.example/x');
    });
    it('refuses unsafe or missing destinations', () => {
        expect(productHref(product({ originalUrl: 'javascript:alert(1)' }), codes)).toBeNull();
        expect(productHref(product({}), codes)).toBeNull();
    });
});
