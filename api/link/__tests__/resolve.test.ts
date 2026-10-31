import { describe, it, expect, vi, afterEach } from 'vitest';
import handler from '../resolve';

const call = (target: string) =>
    handler(new Request(`https://gather.link/api/link/resolve?url=${encodeURIComponent(target)}`));

const redirect = (location: string) => new Response(null, { status: 301, headers: { location } });

describe('api/link/resolve', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('refuses to fetch non-Amazon URLs', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        for (const target of [
            'http://169.254.169.254/latest/meta-data/',
            'http://localhost:6379/',
            'https://example.com/',
            'https://amzn.to.evil.com/abc',
            'file:///etc/passwd',
        ]) {
            const res = await call(target);
            expect(res.status).toBe(400);
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('follows Amazon redirects to the product URL', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(redirect('https://www.amazon.in/dp/B0TEST?ref=x'))
            .mockResolvedValueOnce(new Response('ok', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const res = await call('https://amzn.to/abc123');
        expect(await res.json()).toEqual({ url: 'https://www.amazon.in/dp/B0TEST?ref=x' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
    });

    it('stops instead of fetching a redirect that leaves Amazon', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(redirect('http://10.0.0.5/internal'));
        vi.stubGlobal('fetch', fetchMock);

        const res = await call('https://amzn.to/abc123');
        expect(await res.json()).toEqual({ url: 'https://amzn.to/abc123' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
