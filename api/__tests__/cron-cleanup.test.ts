import { describe, it, expect, vi, afterEach } from 'vitest';
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
});
