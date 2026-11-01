import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AppMetadata {
    name: string;
    developer?: string;
    iconUrl?: string;
    category?: string;
    description?: string;
    linkUrl: string;
    isPaid: boolean;
}

/**
 * The only URLs this endpoint will look up, parsed strictly by hostname.
 * It used to check `url.includes('play.google.com')` and then fetch the URL
 * as given, so anyone could make our server request any address (SSRF) with
 * e.g. `http://10.0.0.1/?x=play.google.com&id=1`. Now the Play Store page is
 * fetched from a URL we build, and App Store lookups only send a numeric id
 * to Apple's API.
 */
type ParsedStoreUrl = { platform: 'ios'; appId: string } | { platform: 'android'; packageId: string };

const PLAY_PACKAGE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/;

export function parseStoreUrl(raw: string): ParsedStoreUrl | null {
    let u: URL;
    try {
        u = new URL(raw);
    } catch {
        return null;
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.username || u.password || (u.port && u.port !== '443' && u.port !== '80')) return null;
    const host = u.hostname.toLowerCase();

    if (host === 'apps.apple.com' || host === 'itunes.apple.com') {
        const m = u.pathname.match(/\/id(\d{1,15})(?:\/|$)/);
        return m ? { platform: 'ios', appId: m[1] } : null;
    }
    if (host === 'play.google.com' && u.pathname.startsWith('/store/apps/details')) {
        const id = u.searchParams.get('id');
        return id && id.length <= 255 && PLAY_PACKAGE.test(id) ? { platform: 'android', packageId: id } : null;
    }
    return null;
}

/**
 * Fetch app metadata from iOS App Store via iTunes Lookup API
 */
async function fetchAppStoreMetadata(appId: string, url: string): Promise<AppMetadata | null> {
    try {
        const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=US`, { redirect: 'error' });
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const app = data.results[0];
        return {
            name: app.trackName,
            developer: app.artistName,
            iconUrl: app.artworkUrl512 || app.artworkUrl100,
            category: app.primaryGenreName,
            description: app.description?.substring(0, 200),
            linkUrl: url,
            isPaid: app.price > 0,
        };
    } catch (error) {
        console.error('[AppLookup] App Store fetch failed:', error);
        return null;
    }
}

/**
 * Fetch app metadata from Google Play Store
 * Note: Google doesn't have an official API, so we use a scraping approach
 * or fall back to Gemini AI for extraction
 */
async function fetchPlayStoreMetadata(packageId: string, url: string): Promise<AppMetadata | null> {
    try {
        // Fetch the canonical page for the validated package id, never the
        // caller's URL, and don't follow redirects off Google Play.
        const pageUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageId)}&hl=en`;
        const response = await fetch(pageUrl, {
            redirect: 'error',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (!response.ok) return null;

        const html = await response.text();

        // Extract basic metadata from HTML using regex
        const nameMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>([^<]+)<\/h1>/i) ||
            html.match(/<title>([^-–]+)/);
        const developerMatch = html.match(/<a[^>]*href="\/store\/apps\/dev[^"]*"[^>]*>([^<]+)<\/a>/i) ||
            html.match(/<span[^>]*>([^<]+)<\/span>\s*<span[^>]*>More by/i);

        // Try to extract icon URL from various patterns
        const iconMatch = html.match(/srcset="([^"]*googleusercontent[^"]*=s\d+[^"]*)"/) ||
            html.match(/src="([^"]*googleusercontent[^"]*=s\d+[^"]*)"/) ||
            html.match(/data-src="([^"]*googleusercontent[^"]*)"/) ||
            html.match(/"([^"]*lh3\.googleusercontent\.com[^"]+)"/);

        let iconUrl = iconMatch ? iconMatch[1].split(' ')[0] : undefined;
        if (iconUrl && !iconUrl.startsWith('http')) {
            iconUrl = 'https:' + iconUrl;
        }
        // Ensure we get a larger icon size
        if (iconUrl && iconUrl.includes('=s')) {
            iconUrl = iconUrl.replace(/=s\d+/, '=s512');
        } else if (iconUrl) {
            iconUrl = iconUrl + '=s512';
        }

        const categoryMatch = html.match(/<a[^>]*href="\/store\/apps\/category\/([^"]+)"[^>]*>([^<]+)<\/a>/i);

        const name = nameMatch ? nameMatch[1].trim().replace(/ - Apps on Google Play$/, '') : packageId;
        const developer = developerMatch ? developerMatch[1].trim() : undefined;
        const category = categoryMatch ? categoryMatch[2].trim() : undefined;

        // Check if paid (has price pattern)
        const priceMatch = html.match(/\$\d+\.\d{2}/);
        const isPaid = !!priceMatch;

        return {
            name,
            developer,
            iconUrl,
            category,
            linkUrl: url,
            isPaid,
        };
    } catch (error) {
        console.error('[AppLookup] Play Store fetch failed:', error);
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS for browser requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid URL' });
    }

    try {
        let metadata: AppMetadata | null = null;

        const parsed = url.length <= 2048 ? parseStoreUrl(url) : null;
        if (!parsed) {
            return res.status(400).json({ error: 'Only App Store and Google Play app links are supported' });
        }
        metadata = parsed.platform === 'ios'
            ? await fetchAppStoreMetadata(parsed.appId, url)
            : await fetchPlayStoreMetadata(parsed.packageId, url);

        if (!metadata) {
            // Fallback: return minimal data
            return res.status(200).json({
                name: 'Unknown App',
                linkUrl: url,
                isPaid: false,
            });
        }

        return res.status(200).json(metadata);
    } catch (error: any) {
        console.error('[AppLookup] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch app metadata' });
    }
}
