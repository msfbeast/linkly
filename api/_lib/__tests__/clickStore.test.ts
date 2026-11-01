import { describe, it, expect, vi, afterEach } from 'vitest';
import { recordClick, storeClick, type ClickEvent, type ClickStoreEnv } from '../clickStore';
import { hashIp } from '../../../utils/ipHash';

const event: ClickEvent = {
    linkId: 'link-1',
    timestamp: Date.UTC(2026, 10, 1, 12, 0, 0),
    userAgent: 'Mozilla/5.0',
    ip: '1.2.3.4, 10.0.0.1',
    referrer: 'https://t.co/',
    country: 'IN',
    city: 'Pune',
    region: 'MH',
    latitude: '18.52',
    longitude: '73.85',
};

const env: ClickStoreEnv = {
    supabaseUrl: 'https://db.example.supabase.co',
    serviceKey: 'service-key',
    ipHashSalt: 'salt',
    qstashUrl: 'https://qstash.example',
    qstashToken: 'qtoken',
    workerUrl: 'https://app.example/api/queue/process-click',
};

const ok = (body = '{}') => new Response(body, { status: 200 });

function stubFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
    const fn = vi.fn(async (url: string, init: RequestInit) => handler(url, init));
    vi.stubGlobal('fetch', fn);
    return fn;
}

describe('storeClick', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('inserts the click with a hashed IP and numeric coordinates, then bumps the counter', async () => {
        const fetchMock = stubFetch(() => ok());
        expect(await storeClick(event, env)).toEqual({ ok: true });

        const [insertUrl, insertInit] = fetchMock.mock.calls[0];
        expect(insertUrl).toBe('https://db.example.supabase.co/rest/v1/click_events');
        const row = JSON.parse(insertInit.body as string);
        expect(row).toMatchObject({
            link_id: 'link-1',
            timestamp: '2026-11-01T12:00:00.000Z',
            ip_hash: await hashIp('1.2.3.4', 'salt'),
            latitude: 18.52,
            longitude: 73.85,
            city: 'Pune',
        });
        expect(JSON.stringify(row)).not.toContain('1.2.3.4');
        expect(fetchMock.mock.calls[1][0]).toBe('https://db.example.supabase.co/rest/v1/rpc/increment_link_clicks');
    });

    it('reports a failed insert instead of swallowing it', async () => {
        stubFetch(() => new Response('bad', { status: 400 }));
        expect(await storeClick(event, env)).toEqual({ ok: false, error: 'insert 400: bad' });
    });

    it('fails clearly when Supabase is not configured', async () => {
        const fetchMock = stubFetch(() => ok());
        expect(await storeClick(event, { ...env, serviceKey: undefined })).toMatchObject({ ok: false });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('recordClick', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('stores directly by default, without touching QStash', async () => {
        const fetchMock = stubFetch(() => ok());
        expect(await recordClick(event, env)).toBe('stored');
        expect(fetchMock.mock.calls.every(([u]) => !String(u).startsWith('https://qstash'))).toBe(true);
    });

    it('queues through QStash when CLICK_QUEUE=qstash', async () => {
        const fetchMock = stubFetch(() => ok());
        expect(await recordClick(event, { ...env, clickQueue: 'qstash' })).toBe('queued');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://qstash.example/v2/publish/https://app.example/api/queue/process-click');
    });

    it('falls back to storing directly when the QStash publish fails', async () => {
        const fetchMock = stubFetch((url) => (url.startsWith('https://qstash') ? new Response('nope', { status: 401 }) : ok()));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await recordClick(event, { ...env, clickQueue: 'qstash' })).toBe('stored');
        expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/rest/v1/click_events'))).toBe(true);
    });

    it('falls back to storing directly when QStash is selected but not configured', async () => {
        stubFetch(() => ok());
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await recordClick(event, { ...env, clickQueue: 'qstash', qstashToken: undefined })).toBe('stored');
    });

    it('returns failed (and logs) when the click cannot be stored', async () => {
        stubFetch(() => new Response('down', { status: 503 }));
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await recordClick(event, env)).toBe('failed');
        expect(log).toHaveBeenCalled();
    });
});
