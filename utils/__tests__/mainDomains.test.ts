import { describe, it, expect } from 'vitest';
import { isMainDomain } from '../mainDomains';

describe('isMainDomain', () => {
    it('matches the app domains exactly', () => {
        expect(isMainDomain('gather.link')).toBe(true);
        expect(isMainDomain('app.gather.link')).toBe(true);
        expect(isMainDomain('links.trak.in')).toBe(true);
        expect(isMainDomain('localhost')).toBe(true);
        expect(isMainDomain('GATHER.LINK.')).toBe(true);
    });

    it('matches subdomains of domains we own', () => {
        expect(isMainDomain('custom.gather.link')).toBe(true);
    });

    it('rejects look-alike hosts that only contain a main domain', () => {
        expect(isMainDomain('gather.link.evil.com')).toBe(false);
        expect(isMainDomain('evilgather.link')).toBe(false);
        expect(isMainDomain('localhost.evil.com')).toBe(false);
        expect(isMainDomain('links.trak.in.evil.com')).toBe(false);
        expect(isMainDomain('other.trak.in')).toBe(false);
        expect(isMainDomain('mybrand.com')).toBe(false);
    });

    it('accepts extra hosts passed by the caller', () => {
        expect(isMainDomain('staging.example.com', ['staging.example.com'])).toBe(true);
    });
});
