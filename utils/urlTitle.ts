/**
 * Derive a human-readable title from a URL — deterministic, offline, free.
 * Used as the fallback when AI analysis fails or is unavailable, so links
 * never end up titled "New Link" (which made the dashboard unscannable).
 */

/** Hosts whose paths are opaque IDs — fall back to a friendly service name. */
const KNOWN_HOSTS: Record<string, string> = {
    'docs.google.com': 'Google Docs',
    'drive.google.com': 'Google Drive',
    'forms.gle': 'Google Form',
    'youtu.be': 'YouTube Video',
    'youtube.com': 'YouTube',
    'wa.me': 'WhatsApp',
    'chat.whatsapp.com': 'WhatsApp Group',
    't.me': 'Telegram',
    'bit.ly': 'Shortened Link',
    'amzn.to': 'Amazon Product',
};

/** True for path segments that are IDs, not words: hex blobs, uuids, numbers. */
const isOpaqueSegment = (seg: string): boolean => {
    if (!seg) return true;
    if (/^[0-9]+$/.test(seg)) return true;                    // pure number
    if (/^[0-9a-f-]{16,}$/i.test(seg)) return true;           // uuid / hex id
    if (/^[A-Za-z0-9_-]{15,}$/.test(seg) && !seg.includes('-')) return true; // long random token
    if (/^(index|home|p|dp|d|s|r|u|v|e)$/i.test(seg)) return true; // structural segments
    const letters = (seg.match(/[a-z]/gi) || []).length;
    return letters < seg.length * 0.5;                        // mostly non-letters
};

const titleCase = (s: string): string =>
    s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const cleanHostname = (hostname: string): string => {
    const host = hostname.replace(/^www\./, '');
    // "flipkart.com" -> "Flipkart", "headphonezone.in" -> "Headphonezone"
    const brand = host.split('.')[0];
    return brand.charAt(0).toUpperCase() + brand.slice(1);
};

export const titleFromUrl = (url: string, maxLength = 60): string => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');

        if (KNOWN_HOSTS[host]) return KNOWN_HOSTS[host];

        // Find the most descriptive path segment (usually the product/article slug)
        const segments = parsed.pathname
            .split('/')
            .filter(Boolean)
            .filter(seg => !isOpaqueSegment(seg));

        // Prefer the longest word-like segment
        const slug = segments.sort((a, b) => b.length - a.length)[0];

        if (slug) {
            let title = titleCase(
                decodeURIComponent(slug)
                    .replace(/[-_+]/g, ' ')
                    .replace(/\.(html?|php|aspx?)$/i, '')
                    .replace(/\s+/g, ' ')
                    .trim()
            );
            if (title.length > maxLength) {
                title = title.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
            }
            return `${title} · ${cleanHostname(parsed.hostname)}`;
        }

        // No usable slug — fall back to the brand name
        return cleanHostname(parsed.hostname);
    } catch {
        return 'Untitled Link';
    }
};
