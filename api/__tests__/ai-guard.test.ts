import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({ user: null as any }));
vi.mock('../_lib/supabaseServer', () => ({ getUserFromRequest: async () => state.user, getAdminClient: () => null }));

import { requireAiUser, setAiLimiterForTests, validUrl, boundedText, MAX_TEXT_LENGTH } from '../_lib/aiGuard';

function mockRes() {
    const res: any = { statusCode: 200, headers: {} };
    res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    return res;
}

describe('requireAiUser', () => {
    beforeEach(() => { state.user = null; setAiLimiterForTests(null); });

    it('rejects anonymous callers', async () => {
        const res = mockRes();
        expect(await requireAiUser({} as any, res)).toBeNull();
        expect(res.statusCode).toBe(401);
    });

    it('rate limits per user', async () => {
        state.user = { id: 'u1' };
        const seen: string[] = [];
        setAiLimiterForTests({ limit: async (k) => { seen.push(k); return { success: false, reset: Date.now() + 30_000 }; } });
        const res = mockRes();
        expect(await requireAiUser({} as any, res)).toBeNull();
        expect(res.statusCode).toBe(429);
        expect(seen).toEqual(['u1']);
        expect(Number(res.headers['Retry-After'])).toBeGreaterThan(0);
    });

    it('lets a signed-in user under the limit through, and fails open if Redis errors', async () => {
        state.user = { id: 'u1' };
        setAiLimiterForTests({ limit: async () => ({ success: true, reset: 0 }) });
        expect(await requireAiUser({} as any, mockRes())).toEqual({ id: 'u1' });
        setAiLimiterForTests({ limit: async () => { throw new Error('redis down'); } });
        expect(await requireAiUser({} as any, mockRes())).toEqual({ id: 'u1' });
    });
});

describe('input bounds', () => {
    it('accepts only http(s) URLs of sane length', () => {
        expect(validUrl('https://example.com/a')).toBe('https://example.com/a');
        expect(validUrl('javascript:alert(1)')).toBeNull();
        expect(validUrl('https://e.com/' + 'a'.repeat(3000))).toBeNull();
        expect(validUrl(42)).toBeNull();
    });
    it('caps free text', () => {
        expect(boundedText('x'.repeat(10_000))).toHaveLength(MAX_TEXT_LENGTH);
        expect(boundedText(undefined)).toBe('');
    });
});
