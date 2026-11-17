import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, { errorReportLimit } from '../client-error';

const post = (body: unknown) => handler(new Request('https://links.trak.in/api/client-error', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'user-agent': 'TestUA', 'x-forwarded-for': '203.0.113.5' }, body: JSON.stringify(body),
}));

beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    errorReportLimit.setForTests(null);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); errorReportLimit.setForTests(undefined); });

describe('/api/client-error', () => {
    it('records the error with the path only and a fingerprint', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal('fetch', fetchMock);
        const res = await post({ message: 'Cannot read x', stack: 'at f (a.js:1:1)', path: 'https://links.trak.in/claim/tok?email=a@b.com', release: 'abc123' });
        expect(res.status).toBe(204);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://db.example/rest/v1/rpc/record_error');
        const body = JSON.parse(init.body);
        expect(body).toMatchObject({ p_source: 'browser', p_message: 'Cannot read x', p_path: '/claim/tok', p_release: 'abc123', p_user_agent: 'TestUA' });
        expect(body.p_fingerprint).toMatch(/^[0-9a-f]{32}$/);
        expect(JSON.stringify(body)).not.toContain('203.0.113.5');
    });

    it('skips noise, empty messages and visitors over the limit', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        expect((await post({ message: 'ResizeObserver loop limit exceeded' })).status).toBe(204);
        expect((await post({ message: '' })).status).toBe(400);
        errorReportLimit.setForTests({ limit: async () => ({ success: false, reset: Date.now() + 1000 }) });
        expect((await post({ message: 'real error' })).status).toBe(429);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
