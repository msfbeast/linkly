import { describe, it, expect, vi, beforeEach } from 'vitest';

const { resolveCname, resolveTxt, row, update } = vi.hoisted(() => ({
    resolveCname: vi.fn(),
    resolveTxt: vi.fn(),
    row: { current: null as Record<string, unknown> | null, lookups: 0 },
    update: vi.fn(),
}));

vi.mock('dns', () => ({ default: { promises: { resolveCname, resolveTxt } }, promises: { resolveCname, resolveTxt } }));
vi.mock('../_lib/supabaseServer', () => ({
    getUserFromRequest: async () => ({ id: 'user-1' }),
    getAdminClient: () => ({
        from: () => {
            const b: any = {
                select: () => b, eq: () => b, neq: () => b, delete: () => b,
                // 1st lookup: the claim; later ones (someone else live?): none
                maybeSingle: async () => ({ data: row.lookups++ === 0 ? row.current : null }),
                update: (v: unknown) => { update(v); return b; },
                single: async () => ({ data: { ...row.current, status: 'active' }, error: null }),
                then: (r: (v: unknown) => void) => r({ data: null, error: null }),
            };
            return b;
        },
    }),
}));

import handler from '../domain/verify';

function call() {
    const res: any = { statusCode: 200 };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    return handler({ method: 'POST', body: { domainId: 'd1' }, headers: {} } as any, res).then(() => res);
}

beforeEach(() => {
    vi.clearAllMocks();
    row.lookups = 0;
    row.current = { id: 'd1', user_id: 'user-1', domain: 'links.example.com', status: 'pending', verification_token: 'tok-123' };
    resolveCname.mockResolvedValue(['custom.gather.link.']);
});

describe('/api/domain/verify', () => {
    it('does not activate a domain on the CNAME alone', async () => {
        resolveTxt.mockRejectedValue(Object.assign(new Error('nodata'), { code: 'ENODATA' }));
        const res = await call();
        expect(res.body.verified).toBe(false);
        expect(res.body.error).toContain('_gather.links.example.com');
        expect(res.body.error).toContain('gather-verification=tok-123');
        expect(update).not.toHaveBeenCalled();
    });

    it('activates when the TXT record holds the claimant\'s token', async () => {
        resolveTxt.mockResolvedValue([['some-other-record'], ['gather-verification=', 'tok-123']]);
        const res = await call();
        expect(resolveTxt).toHaveBeenCalledWith('_gather.links.example.com');
        expect(res.body.verified).toBe(true);
        expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('refuses someone else\'s token', async () => {
        resolveTxt.mockResolvedValue([['gather-verification=someone-elses-token']]);
        const res = await call();
        expect(res.body.verified).toBe(false);
        expect(update).not.toHaveBeenCalled();
    });

    it('still requires the CNAME', async () => {
        resolveCname.mockResolvedValue(['elsewhere.example.net']);
        resolveTxt.mockResolvedValue([['gather-verification=tok-123']]);
        const res = await call();
        expect(res.body.verified).toBe(false);
        expect(update).not.toHaveBeenCalled();
    });
});
