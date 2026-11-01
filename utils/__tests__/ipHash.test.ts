import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { hashIp, normalizeIp } from '../ipHash';
import * as nodeImpl from '../../scripts/lib/ipHashing.js';

const SECRET = 'test-secret';
const HMAC_HEX = /^[0-9a-f]{64}$/;

describe('ipHash', () => {
    it('uses the first address of a forwarded list and drops unknowns', () => {
        expect(normalizeIp(' 1.2.3.4 , 10.0.0.1')).toBe('1.2.3.4');
        expect(normalizeIp('unknown')).toBeNull();
        expect(normalizeIp('')).toBeNull();
        expect(normalizeIp(undefined)).toBeNull();
    });

    it('is a stable keyed hash: same input and secret match, another secret differs', async () => {
        const a = await hashIp('1.2.3.4', SECRET);
        expect(a).toMatch(HMAC_HEX);
        expect(await hashIp('1.2.3.4, 9.9.9.9', SECRET)).toBe(a);
        expect(await hashIp('1.2.3.4', 'other-secret')).not.toBe(a);
    });

    it('matches the Node copy used by scripts/hash-stored-ips.js', async () => {
        await fc.assert(
            fc.asyncProperty(fc.oneof(fc.ipV4(), fc.ipV6(), fc.string()), fc.string({ minLength: 1 }), async (raw, secret) => {
                expect(nodeImpl.normalizeIp(raw)).toBe(normalizeIp(raw));
                const ip = normalizeIp(raw);
                if (ip) expect(nodeImpl.hmacIp(ip, secret)).toBe(await hashIp(ip, secret));
            }),
            { numRuns: 200 },
        );
    });
});

describe('planRowUpdate (backfill)', () => {
    const plan = (row: Record<string, unknown>) => nodeImpl.planRowUpdate(row, SECRET);

    it('leaves rows that are already clean alone', async () => {
        const hashed = await hashIp('1.2.3.4', SECRET);
        expect(plan({ ip_hash: hashed })).toBeNull();
        expect(plan({ ip_hash: null })).toBeNull();
        expect(plan({ ip_hash: hashed, ip_address: null })).toBeNull();
    });

    it('hashes raw IPs stored in ip_hash, the same way new clicks are hashed', async () => {
        expect(plan({ ip_hash: '1.2.3.4, 10.0.0.1' })).toEqual({ ip_hash: await hashIp('1.2.3.4', SECRET) });
        expect(plan({ ip_hash: 'unknown' })).toEqual({ ip_hash: null });
    });

    it('re-hashes old 32-bit hashes so they can no longer be reversed', () => {
        const update = plan({ ip_hash: '1f3a9c2b' });
        expect(update.ip_hash).toMatch(HMAC_HEX);
    });

    it('moves a raw ip_address into ip_hash (hashed) and clears it', async () => {
        expect(plan({ ip_hash: null, ip_address: '5.6.7.8' })).toEqual({
            ip_hash: await hashIp('5.6.7.8', SECRET),
            ip_address: null,
        });
        const hashed = await hashIp('1.2.3.4', SECRET);
        expect(plan({ ip_hash: hashed, ip_address: '5.6.7.8' })).toEqual({ ip_address: null });
    });
});
