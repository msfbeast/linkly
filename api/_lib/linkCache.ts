/**
 * The redirect cache (Vercel KV): what /api/r/:code needs to redirect a
 * short code without a database round trip.
 *
 * One shape for every writer (the edge's DB fallback, /api/link/sync, the
 * v1 API) so restrictions survive caching:
 * - expiry and start are stored as epoch ms (Postgres returns ISO strings;
 *   comparing Date.now() with a string is always false, so expired links
 *   redirected). Older entries may still hold strings: readers parse both.
 * - archived links and expired guest links are never cached.
 * - entries expire after LINK_CACHE_TTL_SECONDS, so a key a failed delete
 *   left behind stops serving and is rebuilt from the database.
 */

export interface KvLinkData {
    url: string;
    id: string;
    password?: boolean;
    /** epoch ms (older entries: ISO string) */
    expiration?: number | string;
    /** epoch ms (older entries: ISO string) */
    start?: number | string;
    /** the link stops after this many clicks; the /unlock page checks the count */
    maxClicks?: number;
    /** guest links are deleted after this (epoch ms); serve nothing past it */
    guestExpiresAt?: number;
    /**
     * A/B test, device or country destinations: only the browser redirect
     * page (pages/Redirect.tsx) picks the destination for these.
     */
    appOnly?: boolean;
}

/** The links columns toCacheEntry needs. */
export const LINK_CACHE_COLUMNS =
    'id, original_url, password_hash, expiration_date, start_date, max_clicks, is_archived, is_guest, expires_at, ab_test_config, smart_redirects, geo_redirects';

export interface LinkCacheRow {
    id: string;
    original_url: string | null;
    password_hash?: string | null;
    expiration_date?: string | null;
    start_date?: string | null;
    max_clicks?: number | null;
    is_archived?: boolean | null;
    is_guest?: boolean | null;
    expires_at?: string | null;
    ab_test_config?: { enabled?: boolean; variants?: unknown[] } | null;
    smart_redirects?: Record<string, unknown> | null;
    geo_redirects?: Record<string, unknown> | null;
}

const hasEntries = (value: Record<string, unknown> | null | undefined) =>
    !!value && Object.values(value).some(v => !!v);

export const LINK_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export const linkCacheKey = (code: string) => `gather:link:${code}`;

/** Epoch ms from a number or an ISO string; undefined when absent or unparseable. */
export function toMs(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const ms = typeof value === 'number' ? value : Date.parse(value);
    return Number.isFinite(ms) ? ms : undefined;
}

/** The cache entry for a link row, or null if the link must not redirect. */
export function toCacheEntry(row: LinkCacheRow, now: number = Date.now()): KvLinkData | null {
    if (!row.original_url || row.is_archived) return null;
    const guestExpiresAt = row.is_guest ? toMs(row.expires_at) : undefined;
    if (guestExpiresAt !== undefined && now >= guestExpiresAt) return null;

    const entry: KvLinkData = { url: row.original_url, id: row.id };
    if (row.password_hash) entry.password = true;
    const expiration = toMs(row.expiration_date);
    if (expiration !== undefined) entry.expiration = expiration;
    const start = toMs(row.start_date);
    if (start !== undefined) entry.start = start;
    if (row.max_clicks) entry.maxClicks = row.max_clicks;
    if (guestExpiresAt !== undefined) entry.guestExpiresAt = guestExpiresAt;
    if ((row.ab_test_config?.enabled && (row.ab_test_config.variants?.length ?? 0) > 0) ||
        hasEntries(row.smart_redirects) || hasEntries(row.geo_redirects)) {
        entry.appOnly = true;
    }
    return entry;
}

/**
 * What the redirect does with a cached entry:
 * - 'gone': the guest link has expired (treat as not found)
 * - 'interstitial': password, expired, not started yet, click-limited, or
 *   A/B / device / country destinations; the browser redirect page
 *   (/unlock) explains, asks or picks the destination and counts the click
 * - 'redirect': send the visitor on and count the click
 */
export function redirectDecision(entry: KvLinkData, now: number = Date.now()): 'gone' | 'interstitial' | 'redirect' {
    if (entry.guestExpiresAt !== undefined && now >= entry.guestExpiresAt) return 'gone';
    const expiration = toMs(entry.expiration);
    const start = toMs(entry.start);
    if (entry.password ||
        (expiration !== undefined && now > expiration) ||
        (start !== undefined && now < start) ||
        entry.maxClicks ||
        entry.appOnly) {
        return 'interstitial';
    }
    return 'redirect';
}
