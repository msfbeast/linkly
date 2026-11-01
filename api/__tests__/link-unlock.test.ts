import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import unlock from '../link/unlock';
import { hashIp } from '../../utils/ipHash';

const post = (body: unknown, ip = '203.0.113.7') =>
    new Request('https://gather.example/api/link/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify(body),
    });

describe('/api/link/unlock', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let dbResult: unknown;
    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
        vi.stubEnv('IP_HASH_SALT', 'salt');
        dbResult = { status: 'wrong' };
        fetchMock = vi.fn(async () => new Response(JSON.stringify(dbResult)));
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

    it('checks the password with the service role and a keyed visitor hash, never the raw IP', async () => {
        dbResult = { status: 'ok', link: { id: 'l1', original_url: 'https://secret.example' } };
        const res = await unlock(post({ code: 'lck', password: 'opensesame' }));
        expect(res.status).toBe(200);
        expect((await res.json()).link.original_url).toBe('https://secret.example');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://db.example/rest/v1/rpc/unlock_link_checked');
        expect(init.headers.Authorization).toBe('Bearer service');
        const body = JSON.parse(init.body);
        expect(body).toEqual({ p_short_code: 'lck', p_password: 'opensesame', p_visitor: await hashIp('203.0.113.7', 'salt') });
        expect(init.body).not.toContain('203.0.113.7');
    });

    it('answers 401 for a wrong password and 429 once guesses are limited', async () => {
        expect((await unlock(post({ code: 'lck', password: 'nope' }))).status).toBe(401);
        dbResult = { status: 'limited' };
        const res = await unlock(post({ code: 'lck', password: 'nope' }));
        expect(res.status).toBe(429);
        expect(await res.json()).toEqual({ error: 'too_many_attempts' });
    });

    it('rejects bad input without asking the database', async () => {
        expect((await unlock(new Request('https://x/api/link/unlock'))).status).toBe(405);
        expect((await unlock(post({ code: '', password: 'x' }))).status).toBe(400);
        expect((await unlock(post({ code: 'lck', password: '' }))).status).toBe(401);
        expect((await unlock(post({ code: 'lck', password: 'x'.repeat(201) }))).status).toBe(401);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails closed when the database errors', async () => {
        fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));
        expect((await unlock(post({ code: 'lck', password: 'x' }))).status).toBe(500);
    });
});
