import { describe, it, expect, vi } from 'vitest';
import { AnalyticsRepository, type ExportClickRow } from '../AnalyticsRepository';

vi.mock('../../supabaseClient', () => ({ supabase: null, isSupabaseConfigured: () => false, TABLES: {} }));

/**
 * A fake PostgREST client over in-memory clicks: honours eq(link_id),
 * newest-first order, limit, and the (timestamp, id) keyset filter.
 */
function fakeClient(clicksByLink: Record<string, ExportClickRow[]>, failures: { left: number } = { left: 0 }) {
    const calls: { link: string; lte?: string }[] = [];
    const client = {
        from: () => {
            const q: { link?: string; lte?: string; limit?: number } = {};
            const builder: any = {
                select: () => builder,
                eq: (_c: string, v: string) => { q.link = v; return builder; },
                order: () => builder,
                limit: (n: number) => { q.limit = n; return builder; },
                lte: (_c: string, v: string) => { q.lte = v; return builder; },
                then: (resolve: (r: unknown) => void) => {
                    calls.push({ link: q.link!, lte: q.lte });
                    if (failures.left > 0) { failures.left--; return resolve({ data: null, error: { message: 'timeout' } }); }
                    // Postgres doesn't promise an order among equal timestamps: shuffle ties.
                    let rows = [...(clicksByLink[q.link!] || [])]
                        .sort((a, b) => b.timestamp.localeCompare(a.timestamp) || (a.id.charCodeAt(a.id.length - 1) % 2) - (b.id.charCodeAt(b.id.length - 1) % 2));
                    if (q.lte) rows = rows.filter(r => r.timestamp <= q.lte!);
                    resolve({ data: rows.slice(0, q.limit), error: null });
                },
            };
            return builder;
        },
    };
    return { client, calls };
}

const makeClicks = (link: string, n: number): ExportClickRow[] =>
    Array.from({ length: n }, (_, i) => ({
        id: `${link}-${String(i).padStart(6, '0')}`,
        // groups of 3 clicks share a timestamp, so page edges fall inside groups
        timestamp: new Date(Date.UTC(2026, 0, 1) + Math.floor(i / 3) * 1000).toISOString(),
        referrer: null, device: 'mobile', os: 'android', country: 'India',
    }));

describe('getClickEventsForExport', () => {
    it('reads every click of every link across many pages, with no duplicates', async () => {
        const data = { big: makeClicks('big', 12_345), small: makeClicks('small', 7), none: [] };
        const { client, calls } = fakeClient(data);
        const repo = new AnalyticsRepository();
        (repo as any).supabase = client;
        const progress: number[] = [];

        const rows = await repo.getClickEventsForExport(['big', 'small', 'none'], n => progress.push(n));

        expect(rows).toHaveLength(12_352);
        expect(new Set(rows.map(r => r.id)).size).toBe(12_352);
        expect(calls.filter(c => c.link === 'big').length).toBeGreaterThanOrEqual(5); // 2500-row pages
        expect(progress.at(-1)).toBe(12_352);
    });

    it('retries a failed page once', async () => {
        const { client } = fakeClient({ a: makeClicks('a', 10) }, { left: 1 });
        const repo = new AnalyticsRepository();
        (repo as any).supabase = client;
        expect(await repo.getClickEventsForExport(['a'])).toHaveLength(10);
    });

    it('fails the export instead of returning partial data', async () => {
        const { client } = fakeClient({ a: makeClicks('a', 10) }, { left: 2 });
        const repo = new AnalyticsRepository();
        (repo as any).supabase = client;
        await expect(repo.getClickEventsForExport(['a'])).rejects.toThrow(/Export failed/);
    });
});
