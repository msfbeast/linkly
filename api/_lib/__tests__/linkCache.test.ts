import { describe, it, expect } from 'vitest';
import { toMs, toCacheEntry, redirectDecision } from '../linkCache';

const NOW = Date.parse('2026-11-02T12:00:00Z');
const row = { id: 'l1', original_url: 'https://dest.example' };

describe('toMs', () => {
    it('reads numbers and ISO strings, ignores junk', () => {
        expect(toMs(5)).toBe(5);
        expect(toMs('2026-11-02T12:00:00+00:00')).toBe(NOW);
        expect(toMs('not a date')).toBeUndefined();
        expect(toMs(null)).toBeUndefined();
        expect(toMs('')).toBeUndefined();
    });
});

describe('toCacheEntry', () => {
    it('stores restrictions as epoch ms', () => {
        const e = toCacheEntry({ ...row, password_hash: 'h', expiration_date: '2026-11-03T00:00:00Z', start_date: '2026-11-01T00:00:00Z', max_clicks: 100 }, NOW)!;
        expect(e).toEqual({
            url: 'https://dest.example', id: 'l1', password: true,
            expiration: Date.parse('2026-11-03T00:00:00Z'), start: Date.parse('2026-11-01T00:00:00Z'), maxClicks: 100,
        });
    });

    it('refuses archived links and expired guest links', () => {
        expect(toCacheEntry({ ...row, is_archived: true }, NOW)).toBeNull();
        expect(toCacheEntry({ ...row, is_guest: true, expires_at: '2026-11-01T00:00:00Z' }, NOW)).toBeNull();
        expect(toCacheEntry({ ...row, original_url: null }, NOW)).toBeNull();
    });

    it('keeps a live guest link with its deletion time', () => {
        expect(toCacheEntry({ ...row, is_guest: true, expires_at: '2026-11-05T00:00:00Z' }, NOW)?.guestExpiresAt)
            .toBe(Date.parse('2026-11-05T00:00:00Z'));
    });
});

describe('redirectDecision', () => {
    const base = { url: 'https://dest.example', id: 'l1' };
    it('redirects plain links', () => expect(redirectDecision(base, NOW)).toBe('redirect'));
    it('sends restricted links to the unlock page', () => {
        expect(redirectDecision({ ...base, password: true }, NOW)).toBe('interstitial');
        expect(redirectDecision({ ...base, expiration: NOW - 1 }, NOW)).toBe('interstitial');
        expect(redirectDecision({ ...base, start: NOW + 1 }, NOW)).toBe('interstitial');
        expect(redirectDecision({ ...base, maxClicks: 10 }, NOW)).toBe('interstitial');
    });
    it('reads expiry stored as an ISO string by older cache entries', () => {
        // This comparison used to be Date.now() > '2026-...', always false.
        expect(redirectDecision({ ...base, expiration: '2026-11-01T00:00:00Z' }, NOW)).toBe('interstitial');
        expect(redirectDecision({ ...base, expiration: '2026-12-01T00:00:00Z' }, NOW)).toBe('redirect');
    });
    it('treats an expired guest link as gone', () => {
        expect(redirectDecision({ ...base, guestExpiresAt: NOW - 1 }, NOW)).toBe('gone');
    });
});
