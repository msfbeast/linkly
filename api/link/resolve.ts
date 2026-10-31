import { isShortAmazonUrl } from '../../utils/affiliateUtils';

export const config = {
    runtime: 'edge',
};

/**
 * Expands Amazon short links (amzn.to, amzn.in, amazon.in/d/...) to the full
 * product URL so they can be affiliate-tagged.
 *
 * This only ever fetches Amazon hosts. Redirects are followed by hand so every
 * hop is checked: an open "fetch any URL" endpoint lets anyone make our
 * servers request internal or third-party addresses (SSRF).
 */

const MAX_REDIRECTS = 5;
const AMAZON_HOST = /^(?:[a-z0-9-]+\.)*(?:amazon\.(?:in|com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|ae|sa|sg|nl|se|pl|com\.br|com\.mx|com\.tr|eg)|amzn\.(?:to|in|eu|asia))$/;

function isAllowedHop(raw: string): boolean {
    try {
        const u = new URL(raw);
        return (u.protocol === 'https:' || u.protocol === 'http:') &&
            !u.username && !u.password &&
            (u.port === '' || u.port === '80' || u.port === '443') &&
            AMAZON_HOST.test(u.hostname.toLowerCase());
    } catch {
        return false;
    }
}

const json = (body: unknown, status: number, cache = false) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...(cache ? { 'Cache-Control': 'public, max-age=86400' } : {}),
        },
    });

export default async function handler(request: Request) {
    const targetUrl = new URL(request.url).searchParams.get('url');

    if (!targetUrl) {
        return json({ error: 'Missing url parameter' }, 400);
    }
    if (!isShortAmazonUrl(targetUrl) || !isAllowedHop(targetUrl)) {
        return json({ error: 'Only Amazon short links can be resolved' }, 400);
    }

    let current = targetUrl;
    try {
        for (let i = 0; i <= MAX_REDIRECTS; i++) {
            const response = await fetch(current, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });

            const location = response.headers.get('location');
            if (response.status < 300 || response.status >= 400 || !location) {
                return json({ url: current }, 200, true);
            }

            const next = new URL(location, current).toString();
            if (!isAllowedHop(next)) {
                // Redirect leaves Amazon: stop here rather than fetch it.
                return json({ url: current }, 200);
            }
            current = next;
        }
        return json({ url: current }, 200);
    } catch (error) {
        console.error('Error resolving URL:', error);
        // Fall back to the original URL if resolving fails
        return json({ url: targetUrl, error: 'Failed to resolve redirect' }, 200);
    }
}
