import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../track';
import { hashIp } from '../../utils/ipHash';

const LINK = '0b9c2f5e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';

function post(body: unknown, headers: Record<string, string> = {}) {
    return new Request('https://gather.link/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });
}

describe('/api/track', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://db.example.supabase.co');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
        vi.stubEnv('IP_HASH_SALT', 'salt');
        fetchMock = vi.fn(async (url: string) =>
            String(url).includes('/rest/v1/links?')
                ? new Response(JSON.stringify([{ id: LINK }]), { status: 200 })
                : new Response('', { status: 201 }));
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('stores the click with Vercel geo, parsed device and only hashed identifiers', async () => {
        const res = await handler(post(
            { linkId: LINK, referrer: 'https://t.co/', screenWidth: 390, timezone: 'Asia/Kolkata', destinationUrl: 'https://example.com/a' },
            {
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1',
                'x-forwarded-for': '203.0.113.7',
                'x-vercel-ip-country': 'IN',
                'x-vercel-ip-country-region': 'MH',
                'x-vercel-ip-city': 'Mumbai',
            },
        ));
        expect(res.status).toBe(200);

        // No third-party geolocation call: only Supabase.
        expect(fetchMock.mock.calls.every(([u]) => String(u).startsWith('https://db.example.supabase.co/'))).toBe(true);

        const insert = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/rest/v1/click_events?select=id'))!;
        const row = JSON.parse(insert[1].body);
        expect(row).toMatchObject({
            link_id: LINK,
            country: 'India',
            country_code: 'IN',
            region: 'Maharashtra',
            city: 'Mumbai',
            device: 'Mobile',
            os: 'iOS',
            browser: 'Safari',
            screen_width: 390,
            timezone: 'Asia/Kolkata',
            destination_url: 'https://example.com/a',
            ip_hash: await hashIp('203.0.113.7', 'salt'),
        });
        expect(row.fingerprint).toMatch(/^[0-9a-f]{64}$/);
        expect(row.visitor_id).toMatch(/^[0-9a-f]{64}$/);
        expect(JSON.stringify(row)).not.toContain('203.0.113.7');
    });

    it('stores a page retry with the same event id once, and counts it once', async () => {
        const EVENT = '5d3c1e6a-8f2b-4c1d-9a7e-3b2c1d0e9f8a';
        const stored = new Set<string>();
        fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
            if (String(url).includes('/rest/v1/links?')) return new Response(JSON.stringify([{ id: LINK }]), { status: 200 });
            if (String(url).includes('/click_events')) {
                const id = JSON.parse(String(init!.body)).id;
                if (stored.has(id)) return new Response('[]', { status: 201 }); // ON CONFLICT DO NOTHING
                stored.add(id);
                return new Response(JSON.stringify([{ id }]), { status: 201 });
            }
            return new Response('', { status: 200 });
        });
        const ua = { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile', 'x-forwarded-for': '203.0.113.9' };
        await handler(post({ linkId: LINK, eventId: EVENT }, ua));
        await handler(post({ linkId: LINK, eventId: EVENT }, ua));

        const inserts = fetchMock.mock.calls.filter(([u]) => String(u).includes('/click_events'));
        expect(inserts.map(([, i]) => JSON.parse(String(i.body)).id)).toEqual([EVENT, EVENT]);
        expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/rpc/increment_link_clicks'))).toHaveLength(1);
    });

    it('ignores an event id that is not a UUID', async () => {
        await handler(post({ linkId: LINK, eventId: 'abc; drop table' }, { 'x-forwarded-for': '203.0.113.10' }));
        const insert = fetchMock.mock.calls.find(([u]) => String(u).includes('/click_events'))!;
        expect(JSON.parse(String(insert[1].body)).id).toBeUndefined();
    });

    it('rejects unknown links and bad input without storing anything', async () => {
        fetchMock.mockImplementation(async () => new Response('[]', { status: 200 }));
        expect((await handler(post({ linkId: LINK }))).status).toBe(404);
        expect((await handler(post({ linkId: 'not-a-uuid' }))).status).toBe(400);
        expect((await handler(post('{nope'))).status).toBe(400);
        expect((await handler(new Request('https://gather.link/api/track'))).status).toBe(405);
        expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/click_events'))).toBe(false);
    });
});
