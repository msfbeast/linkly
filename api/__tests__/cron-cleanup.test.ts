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

function mockRes() {
    const res: any = { statusCode: 200 };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    return res;
}

describe('/api/cron/cleanup', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('rejects "Bearer undefined" when CRON_SECRET is not set', async () => {
        vi.stubEnv('CRON_SECRET', '');
        const res = mockRes();
        await handler({ headers: { authorization: 'Bearer undefined' } }, res);
        expect(res.statusCode).toBe(401);
    });

    it('rejects a wrong secret', async () => {
        vi.stubEnv('CRON_SECRET', 's3cret');
        const res = mockRes();
        await handler({ headers: { authorization: 'Bearer nope' } }, res);
        expect(res.statusCode).toBe(401);
    });

    it('removes deleted guest links from the redirect cache', async () => {
        vi.stubEnv('CRON_SECRET', 's3cret');
        deleted.rows = [{ short_code: 'g1' }, { short_code: 'g2' }];
        const res = mockRes();
        await handler({ headers: { authorization: 'Bearer s3cret' } }, res);
        expect(res.statusCode).toBe(200);
        expect(res.body.deleted_count).toBe(2);
        expect(kvDel).toHaveBeenCalledWith('gather:link:g1', 'gather:link:g2');
    });
});
