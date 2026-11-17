import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../link/guest';
import { setGuestLimiterForTests } from '../_lib/guestLimit';

const post = (body: unknown) =>
    handler(new Request('https://links.trak.in/api/link/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
        body: JSON.stringify(body),
    }));

const ok = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });

beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('IP_HASH_SALT', 'salt');
    setGuestLimiterForTests(null);
});
afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setGuestLimiterForTests(undefined);
});

describe('/api/link/guest', () => {
    it('creates the link through the service role with a server-made code', async () => {
        const fetchMock = vi.fn().mockResolvedValue(ok({ id: 'l1', claim_token: 't1' }));
        vi.stubGlobal('fetch', fetchMock);
        const res = await post({ url: 'amazon.in/dp/B0', sessionId: 's1' });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({ id: 'l1', claimToken: 't1' });
        expect(body.shortCode).toMatch(/^[a-z2-9]{7}$/);
        const [calledUrl, init] = fetchMock.mock.calls[0];
        expect(calledUrl).toBe('https://db.example/rest/v1/rpc/create_guest_link');
        expect(init.headers.Authorization).toBe('Bearer service');
        expect(JSON.parse(init.body)).toMatchObject({ p_original_url: 'https://amazon.in/dp/B0', p_guest_session_id: 's1', p_short_code: body.shortCode });
    });

    it('refuses non-addresses, our own short links and bad sessions without touching the database', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        expect((await post({ url: 'javascript:alert(1)', sessionId: 's1' })).status).toBe(400);
        expect((await post({ url: 'me@gmail.com', sessionId: 's1' })).status).toBe(400);
        expect((await post({ url: 'https://links.trak.in/abc', sessionId: 's1' })).status).toBe(400);
        expect((await post({ url: 'https://ok.example', sessionId: '' })).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('answers 429 once the visitor is over the hourly limit', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        setGuestLimiterForTests({ limit: async () => ({ success: false, reset: Date.now() + 120_000 }) });
        const res = await post({ url: 'https://ok.example', sessionId: 's1' });
        expect(res.status).toBe(429);
        expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(100);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('retries with a new code when the code is taken', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response('{"code":"23505"}', { status: 409 }))
            .mockResolvedValueOnce(ok({ id: 'l2', claim_token: 't2' }));
        vi.stubGlobal('fetch', fetchMock);
        const res = await post({ url: 'https://ok.example', sessionId: 's1' });
        expect(res.status).toBe(200);
        const codes = fetchMock.mock.calls.map(c => JSON.parse(c[1].body).p_short_code);
        expect(codes[0]).not.toBe(codes[1]);
    });
});
