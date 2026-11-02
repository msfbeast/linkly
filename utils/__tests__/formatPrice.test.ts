import { describe, it, expect } from 'vitest';
import { formatPrice } from '../formatPrice';

describe('formatPrice', () => {
    it('formats rupees with Indian grouping', () => {
        expect(formatPrice(149999, 'INR')).toBe('₹1,49,999');
    });

    it('defaults to INR when the currency is missing', () => {
        expect(formatPrice(499, '')).toBe('₹499');
        expect(formatPrice(499, null)).toBe('₹499');
        expect(formatPrice(499)).toBe('₹499');
    });

    it('keeps other currencies', () => {
        expect(formatPrice(9.5, 'USD')).toBe('$9.50');
    });

    it('does not throw on an invalid currency code', () => {
        expect(formatPrice(10, 'rupees')).toBe('rupees 10.00');
    });
});
