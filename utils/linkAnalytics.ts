/**
 * Link analytics page data from get_link_analytics (server-side counts over
 * every click in the range, not just the clicks downloaded with the link).
 */

export type LinkAnalyticsRange = '24h' | '7d' | '30d' | 'all';

export interface Distribution {
    name: string;
    value: number;
    [key: string]: string | number; // lets recharts take it as chart data
}

export interface LinkRangeAnalytics {
    total: number;
    unique: number;
    previousTotal: number;
    previousUnique: number;
    /** Hourly click counts for the chart window (UTC hour starts). */
    hourly: { t: string; c: number }[];
    device: Distribution[];
    browser: Distribution[];
    os: Distribution[];
    country: Distribution[];
    referrer: Distribution[];
    model: Distribution[];
    destination: Distribution[];
}

const list = (v: unknown): Distribution[] =>
    Array.isArray(v)
        ? v.map((d: any) => ({ name: String(d?.name ?? 'Unknown'), value: Number(d?.value) || 0 }))
        : [];

/** Parses the jsonb get_link_analytics returns; null if it isn't one. */
export function parseLinkAnalytics(raw: unknown): LinkRangeAnalytics | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    return {
        total: Number(r.total) || 0,
        unique: Number(r.unique) || 0,
        previousTotal: Number(r.previous_total) || 0,
        previousUnique: Number(r.previous_unique) || 0,
        hourly: Array.isArray(r.hourly)
            ? r.hourly.map((h: any) => ({ t: String(h?.t), c: Number(h?.c) || 0 }))
            : [],
        device: list(r.device),
        browser: list(r.browser),
        os: list(r.os),
        country: list(r.country),
        referrer: list(r.referrer),
        model: list(r.model),
        destination: list(r.destination),
    };
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const hourLabel = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', hour12: true });
const dayLabel = (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Chart points in the page's existing shape: 24 hourly points for '24h',
 * otherwise one point per day (7, 30, or 14 for 'all'), labelled in the
 * viewer's local time. Empty slots are zero.
 */
export function buildTimeline(
    hourly: { t: string; c: number }[],
    range: LinkAnalyticsRange,
    now: number = Date.now(),
): { date: string; clicks: number }[] {
    const data = new Map<string, number>();
    if (range === '24h') {
        for (let i = 23; i >= 0; i--) data.set(hourLabel(now - i * HOUR), 0);
    } else {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 14;
        for (let i = days - 1; i >= 0; i--) data.set(dayLabel(now - i * DAY), 0);
    }
    for (const h of hourly) {
        const ms = Date.parse(h.t);
        if (Number.isNaN(ms)) continue;
        const key = range === '24h' ? hourLabel(ms) : dayLabel(ms);
        if (data.has(key)) data.set(key, (data.get(key) || 0) + h.c);
    }
    return [...data.entries()].map(([date, clicks]) => ({ date, clicks }));
}

/** Percent change, as the page showed it before (100 when there was nothing to compare with). */
export function growth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}
