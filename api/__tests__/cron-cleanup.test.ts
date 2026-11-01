import { describe, it, expect, vi, afterEach } from 'vitest';

const { kvDel, deleted } = vi.hoisted(() => ({ kvDel: vi.fn(), deleted: { rows: [] as { short_code: string }[] } }));
vi.mock('@vercel/kv', () => ({ kv: { del: kvDel } }));
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            delete: () => ({ eq: () => ({ lt: () => ({ select: async () => ({ data: deleted.rows, error: null }) }) }) }),
        }),
    }),
}));

import handler from '../cron/cleanup';

const call = (authorization?: string) =>
    handler(new Request('https://links.trak.in/api/cron/cleanup', {
        headers: authorization ? { authorization } : {},
    }));

describe('/api/cron/cleanup', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('rejects "Bearer undefined" when CRON_SECRET is not set', async () => {
        vi.stubEnv('CRON_SECRET', '');
        expect((await call('Bearer undefined')).status).toBe(401);
    });

    it('rejects a wrong secret', async () => {
        vi.stubEnv('CRON_SECRET', 's3cret');
        expect((await call('Bearer nope')).status).toBe(401);
    });

    it('removes deleted guest links from the redirect cache', async () => {
        vi.stubEnv('CRON_SECRET', 's3cret');
        deleted.rows = [{ short_code: 'g1' }, { short_code: 'g2' }];
        const res = await call('Bearer s3cret');
        expect(res.status).toBe(200);
        expect((await res.json()).deleted_count).toBe(2);
        expect(kvDel).toHaveBeenCalledWith('gather:link:g1', 'gather:link:g2');
    });
});
