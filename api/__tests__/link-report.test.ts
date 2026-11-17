import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, { codeFromInput, reportLimit } from '../link/report';

const post = (body: unknown) => handler(new Request('https://links.trak.in/api/link/report', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.7' }, body: JSON.stringify(body),
}));
const ok = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('IP_HASH_SALT', 'salt');
    reportLimit.setForTests(null);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); reportLimit.setForTests(undefined); });

describe('codeFromInput', () => {
    it('takes the code from a full short link or a bare code', () => {
        expect(codeFromInput('abc123')).toBe('abc123');
        expect(codeFromInput('https://links.trak.in/abc123')).toBe('abc123');
        expect(codeFromInput('links.trak.in/r/abc123?x=1')).toBe('abc123');
        expect(codeFromInput(' /oppo%20find ')).toBe('oppo find');
    });
});

describe('/api/link/report', () => {
    it('saves a report against the link with a hashed reporter', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(ok([{ id: 'l1' }])).mockResolvedValueOnce(new Response(null, { status: 201 }));
        vi.stubGlobal('fetch', fetchMock);
        const res = await post({ code: 'https://links.trak.in/abc', reason: 'phishing', details: 'fake bank login' });
        expect(res.status).toBe(200);
        expect(fetchMock.mock.calls[0][0]).toContain('short_code=eq.abc');
        const saved = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(saved).toMatchObject({ link_id: 'l1', reason: 'phishing', details: 'fake bank login' });
        expect(saved.reporter).not.toContain('198.51.100.7');
    });

    it('refuses bad input without touching the database', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        expect((await post({ code: '', reason: 'spam' })).status).toBe(400);
        expect((await post({ code: 'abc', reason: 'boring' })).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('404s for an unknown code and 429s past the limit', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([])));
        expect((await post({ code: 'nope', reason: 'spam' })).status).toBe(404);
        reportLimit.setForTests({ limit: async () => ({ success: false, reset: Date.now() + 60_000 }) });
        expect((await post({ code: 'abc', reason: 'spam' })).status).toBe(429);
    });
});
