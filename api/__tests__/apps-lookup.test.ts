import { describe, it, expect, vi, afterEach } from 'vitest';
import handler, { parseStoreUrl } from '../apps/lookup';

function mockRes() {
    const res: any = { statusCode: 200, body: undefined, headers: {} };
    res.setHeader = (k: string, v: string) => { res.headers[k] = v; return res; };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    res.end = () => res;
    return res;
}

describe('parseStoreUrl', () => {
    it('accepts real store links', () => {
        expect(parseStoreUrl('https://apps.apple.com/us/app/notion/id1232780281')).toEqual({ platform: 'ios', appId: '1232780281' });
        expect(parseStoreUrl('https://play.google.com/store/apps/details?id=com.notion.android&hl=en')).toEqual({ platform: 'android', packageId: 'com.notion.android' });
    });

    it.each([
        'http://10.0.0.1/admin?x=play.google.com&id=com.a.b',
        'http://169.254.169.254/latest/meta-data?play.google.com',
        'https://play.google.com.evil.example/store/apps/details?id=com.a.b',
        'https://evil.example/?u=https://apps.apple.com/app/id1',
        'https://user:pw@play.google.com/store/apps/details?id=com.a.b',
        'https://play.google.com:8443/store/apps/details?id=com.a.b',
        'https://play.google.com/store/apps/details?id=../../etc',
        'file:///etc/passwd',
    ])('rejects %s', (url) => {
        expect(parseStoreUrl(url)).toBeNull();
    });
});

describe('/api/apps/lookup', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('never fetches the address it was given', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        const res = mockRes();
        await handler({ method: 'POST', body: { url: 'http://10.0.0.1/admin?x=play.google.com&id=1' } } as any, res);
        expect(res.statusCode).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches only the canonical Play Store page, without following redirects', async () => {
        const fetchMock = vi.fn(async () => new Response('<title>Notion - Apps on Google Play</title>', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);
        const res = mockRes();
        await handler({ method: 'POST', body: { url: 'https://play.google.com/store/apps/details?id=com.notion.android&x=1' } } as any, res);
        expect(res.statusCode).toBe(200);
        const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(calledUrl).toBe('https://play.google.com/store/apps/details?id=com.notion.android&hl=en');
        expect(init.redirect).toBe('error');
    });
});
