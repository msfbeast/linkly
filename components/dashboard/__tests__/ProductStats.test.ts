import { describe, it, expect } from 'vitest';
import { clickRate } from '../ProductStats';

describe('clickRate', () => {
    it('is clicks per view as a percentage', () => {
        expect(clickRate(25, 100)).toBe('25%');
        expect(clickRate(1, 400)).toBe('0.3%');
    });
    it('is null without views', () => {
        expect(clickRate(5, 0)).toBeNull();
    });
});
