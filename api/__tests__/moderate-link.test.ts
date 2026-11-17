import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { kvDel } = vi.hoisted(() => ({ kvDel: vi.fn() }));
vi.mock('@vercel/kv', () => ({ kv: { del: kvDel } }));

import handler from '../admin/moderate-link';

const LINK = '11111111-2222-3333-4444-555555555555';
const post = (body: unknown, auth: string | null = 'Bearer user-token') => handler(new Request('https://links.trak.in/api/admin/moderate-link', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(body),
}));

beforeEach(() => {
    kvDel.mockReset();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('/api/admin/moderate-link', () => {
    it("calls the admin function with the caller's own token and clears the redirect cache", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify('phish1'), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        const res = await post({ linkId: LINK, action: 'disable', reason: 'Phishing' });
        expect(res.status).toBe(200);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://db.example/rest/v1/rpc/admin_moderate_link');
        expect(init.headers.Authorization).toBe('Bearer user-token');
        expect(JSON.parse(init.body)).toEqual({ p_link_id: LINK, p_action: 'disable', p_reason: 'Phishing' });
        expect(kvDel).toHaveBeenCalledWith('gather:link:phish1');
    });

    it('passes the refusal on for non-admins and clears nothing', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"code":"42501","message":"Not allowed"}', { status: 403 })));
        expect((await post({ linkId: LINK, action: 'disable' })).status).toBe(403);
        expect(kvDel).not.toHaveBeenCalled();
    });

    it('needs a signed-in caller and valid input', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        expect((await post({ linkId: LINK, action: 'disable' }, null)).status).toBe(401);
        expect((await post({ linkId: 'x', action: 'disable' })).status).toBe(400);
        expect((await post({ linkId: LINK, action: 'delete' })).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
