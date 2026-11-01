/**
 * Keyed hash of a visitor IP, so raw addresses are never stored.
 *
 * A plain hash of an IPv4 address can be reversed by trying all 2^32
 * addresses; an HMAC with a server-side secret can't. Same input and secret
 * always give the same hash, so unique-visitor counts still work.
 *
 * Keep in sync with scripts/lib/ipHashing.js (Node backfill) and
 * supabase/functions/track-click/index.ts (Deno); a test checks the Node copy.
 */

/** First address from an x-forwarded-for style value, or null if there is none. */
export function normalizeIp(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const ip = raw.split(',')[0].trim();
    if (!ip || ip.toLowerCase() === 'unknown') return null;
    return ip;
}

export async function hmacIp(ip: string, secret: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ip));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** normalizeIp + hmacIp; null when there is no usable address. */
export async function hashIp(raw: unknown, secret: string): Promise<string | null> {
    const ip = normalizeIp(raw);
    return ip ? hmacIp(ip, secret) : null;
}
