import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({
    key: null as any,
    tier: 'free' as string | null,
    personalLinks: 0,
    inserted: [] as any[],
}));

vi.mock('@vercel/kv', () => ({ kv: { set: async () => {} } }));
vi.mock('@upstash/redis', () => ({ Redis: { fromEnv: () => { throw new Error('no redis in tests'); } } }));
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: (table: string) => {
            const q: any = {
                _head: false,
                select: (_c?: string, opts?: any) => { q._head = !!opts?.head; return q; },
                eq: () => q,
                is: () => (table === 'links' && q._head ? Promise.resolve({ count: db.personalLinks, error: null }) : q),
                single: async () => (table === 'api_keys'
                    ? { data: db.key, error: db.key ? null : { message: 'none' } }
                    : { data: db.inserted[db.inserted.length - 1], error: null }),
                maybeSingle: async () => (table === 'profiles'
                    ? { data: { subscription_tier: db.tier, amazon_associate_tag: null, flipkart_affiliate_id: null }, error: null }
                    : { data: null, error: null }),
                insert: (row: any) => { db.inserted.push({ ...row, id: 'l1' }); return q; },
            };
            return q;
        },
    }),
}));

import handler from '../v1/links';

const call = (body: unknown) => handler(new Request('https://gather.link/api/v1/links', {
    method: 'POST',
    headers: { Authorization: 'Bearer gk_test', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
}));

describe('POST /api/v1/links', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
        db.key = { user_id: 'u1', scopes: ['links:write'], expires_at: null };
        db.tier = 'free';
        db.personalLinks = 0;
        db.inserted = [];
    });

    it('creates a link for a valid key under the limit', async () => {
        const res = await call({ url: 'https://example.com', tags: ['a'] });
        expect(res.status).toBe(201);
        expect(db.inserted).toHaveLength(1);
    });

    it('rejects an expired key', async () => {
        db.key.expires_at = new Date(Date.now() - 1000).toISOString();
        expect((await call({ url: 'https://example.com' })).status).toBe(401);
        expect(db.inserted).toHaveLength(0);
    });

    it('applies the free plan limit, which the service role would otherwise skip', async () => {
        db.personalLinks = 15;
        const res = await call({ url: 'https://example.com' });
        expect(res.status).toBe(403);
        expect(db.inserted).toHaveLength(0);
    });

    it('does not limit paid plans', async () => {
        db.tier = 'pro';
        db.personalLinks = 500;
        expect((await call({ url: 'https://example.com' })).status).toBe(201);
    });

    it('validates tags and title', async () => {
        expect((await call({ url: 'https://example.com', tags: 'nope' })).status).toBe(400);
        expect((await call({ url: 'https://example.com', tags: [{}] })).status).toBe(400);
        expect((await call({ url: 'https://example.com', title: 'x'.repeat(300) })).status).toBe(400);
        expect(db.inserted).toHaveLength(0);
    });
});
