import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { kvGet, kvSet, kvDel, dbRow, recordClick } = vi.hoisted(() => ({
    kvGet: vi.fn(),
    kvSet: vi.fn(),
    kvDel: vi.fn(),
    dbRow: { current: null as Record<string, unknown> | null },
    recordClick: vi.fn(),
}));

vi.mock('@vercel/kv', () => ({ kv: { get: kvGet, set: kvSet, del: kvDel } }));
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: dbRow.current, error: null }) }),
            }),
        }),
    }),
}));
vi.mock('../_lib/clickStore', () => ({
    recordClick,
    clickStoreEnvFromProcess: () => ({}),
}));

import handler from '../r/[code]';

const DEST = 'https://dest.example/page';
const request = (code: string, ua = 'Mozilla/5.0 (Macintosh)') =>
    new Request(`https://links.trak.in/api/r/${code}`, { headers: { 'user-agent': ua } });
const context = { waitUntil: vi.fn() };

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://links.trak.in');
    dbRow.current = null;
    kvGet.mockResolvedValue(null);
    recordClick.mockResolvedValue({ ok: true });
});
afterEach(() => vi.unstubAllEnvs());

describe('/api/r/:code', () => {
    it('redirects a plain cached link and counts the click', async () => {
        kvGet.mockResolvedValue({ url: DEST, id: 'l1' });
        const res = await handler(request('abc'), context);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe(DEST);
        expect(recordClick).toHaveBeenCalledTimes(1);
    });

    it('falls back to the database when the cache errors, without rewriting the cache', async () => {
        kvGet.mockRejectedValue(new Error('KV down'));
        dbRow.current = { id: 'l1', original_url: DEST };
        const res = await handler(request('abc'), context);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe(DEST);
        expect(kvSet).not.toHaveBeenCalled();
    });

    it('rewarms the cache with an expiring entry after a miss', async () => {
        dbRow.current = { id: 'l1', original_url: DEST };
        await handler(request('abc'), context);
        expect(kvSet).toHaveBeenCalledWith('gather:link:abc', { url: DEST, id: 'l1' }, { ex: expect.any(Number) });
    });

    it('sends an expired link (old cache entry, ISO string) to the unlock page without counting', async () => {
        kvGet.mockResolvedValue({ url: DEST, id: 'l1', expiration: '2020-01-01T00:00:00+00:00' });
        const res = await handler(request('abc'), context);
        expect(res.headers.get('location')).toBe('https://links.trak.in/unlock/abc');
        expect(recordClick).not.toHaveBeenCalled();
    });

    it('sends password links to the unlock page without counting (the page counts after unlock)', async () => {
        kvGet.mockResolvedValue({ url: DEST, id: 'l1', password: true });
        const res = await handler(request('abc'), context);
        expect(res.headers.get('location')).toBe('https://links.trak.in/unlock/abc');
        expect(recordClick).not.toHaveBeenCalled();
    });

    it('does not serve or cache an archived link', async () => {
        dbRow.current = { id: 'l1', original_url: DEST, is_archived: true };
        const res = await handler(request('abc'), context);
        expect(res.status).toBe(404);
        expect(kvSet).not.toHaveBeenCalled();
        expect(recordClick).not.toHaveBeenCalled();
    });

    it('treats an expired guest link left in the cache as gone and clears it', async () => {
        kvGet.mockResolvedValue({ url: DEST, id: 'g1', guestExpiresAt: Date.now() - 1000 });
        const res = await handler(request('guest1'), context);
        expect(res.status).toBe(404);
        expect(kvDel).toHaveBeenCalledWith('gather:link:guest1');
        expect(recordClick).not.toHaveBeenCalled();
    });

    it('returns 404 for an unknown code', async () => {
        const res = await handler(request('nope'), context);
        expect(res.status).toBe(404);
    });
});
