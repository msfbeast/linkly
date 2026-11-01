import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldCount, setCountLimiterForTests } from '../_lib/countLimit';
import bioView from '../bio-view';
import track from '../track';
import { recordClick } from '../_lib/clickStore';
import { hashIp } from '../../utils/ipHash';

const PROFILE = '44444444-4444-4444-4444-444444444444';
const LINK = '0b9c2f5e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';

describe('shouldCount', () => {
    afterEach(() => { setCountLimiterForTests('click', undefined); setCountLimiterForTests('bio', undefined); });

    it('keys by target and keyed IP hash, never the raw IP', async () => {
        const keys: string[] = [];
        setCountLimiterForTests('click', { limit: async (k) => { keys.push(k); return { success: true }; } });
        expect(await shouldCount('click', LINK, 'abc123')).toBe(true);
        expect(keys).toEqual([`${LINK}:abc123`]);
    });

    it('stops counting over the limit, and fails open if Redis errors', async () => {
        setCountLimiterForTests('click', { limit: async () => ({ success: false }) });
        expect(await shouldCount('click', LINK, 'abc')).toBe(false);
        setCountLimiterForTests('click', { limit: async () => { throw new Error('down'); } });
        expect(await shouldCount('click', LINK, 'abc')).toBe(true);
    });
});

describe('rate-limited counting endpoints', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
        vi.stubEnv('IP_HASH_SALT', 'salt');
        fetchMock = vi.fn(async (url: string) =>
            String(url).includes('/rest/v1/links?') ? new Response(JSON.stringify([{ id: LINK }])) : new Response('', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        setCountLimiterForTests('click', undefined);
        setCountLimiterForTests('bio', undefined);
    });

    const post = (url: string, body: unknown) => new Request(url, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' }, body: JSON.stringify(body),
    });

    it('/api/bio-view counts through the service role, keyed by hashed IP', async () => {
        const keys: string[] = [];
        setCountLimiterForTests('bio', { limit: async (k) => { keys.push(k); return { success: true }; } });
        const res = await bioView(post('https://gather.link/api/bio-view', { profileId: PROFILE }));
        expect(await res.json()).toEqual({ success: true, counted: true });
        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('https://db.example/rest/v1/rpc/increment_bio_view');
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer service');
        expect(keys).toEqual([`${PROFILE}:${await hashIp('203.0.113.7', 'salt')}`]);
    });

    it('/api/bio-view skips the increment over the limit and rejects bad ids', async () => {
        setCountLimiterForTests('bio', { limit: async () => ({ success: false }) });
        expect(await (await bioView(post('https://gather.link/api/bio-view', { profileId: PROFILE }))).json()).toEqual({ success: true, counted: false });
        expect((await bioView(post('https://gather.link/api/bio-view', { profileId: 'x' }))).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('/api/track answers 200 but stores nothing over the limit', async () => {
        setCountLimiterForTests('click', { limit: async () => ({ success: false }) });
        const res = await track(post('https://gather.link/api/track', { linkId: LINK }));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true, counted: false });
        expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/click_events'))).toBe(false);
    });

    it('/r/ clicks (recordClick) are limited the same way', async () => {
        setCountLimiterForTests('click', { limit: async () => ({ success: false }) });
        const result = await recordClick({
            linkId: LINK, timestamp: Date.now(), userAgent: 'UA', ip: '203.0.113.7', referrer: null,
            country: null, city: null, region: null, latitude: null, longitude: null,
        }, { supabaseUrl: 'https://db.example', serviceKey: 'service', ipHashSalt: 'salt' });
        expect(result).toBe('limited');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
