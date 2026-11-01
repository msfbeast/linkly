import { describe, it, expect } from 'vitest';
import { backfillTable } from '../ipHashing.js';
import { hashIp } from '../../../utils/ipHash';

const SECRET = 'test-secret';
const HMAC_HEX = /^[0-9a-f]{64}$/;

type Row = Record<string, any>;

/**
 * In-memory stand-in for the parts of supabase-js the backfill uses:
 * select(cols).order('id').limit(n).gt('id', x) and update(v).eq('id', x),
 * with PostgREST-style errors for missing tables and columns.
 */
function fakeDb(tables: Record<string, { columns: string[]; rows: Row[] }>) {
    const writes: { table: string; id: string; update: Row }[] = [];
    const from = (table: string) => {
        const t = tables[table];
        const missingTable = { message: `Could not find the table 'public.${table}' in the schema cache`, code: 'PGRST205' };
        let cols: string[] = [];
        let limit = Infinity;
        let after: string | null = null;
        const run = () => {
            if (!t) return { data: null, error: missingTable };
            const bad = cols.find(c => !t.columns.includes(c));
            if (bad) return { data: null, error: { message: `column ${table}.${bad} does not exist`, code: '42703' } };
            const rows = [...t.rows]
                .sort((a, b) => (a.id < b.id ? -1 : 1))
                .filter(r => after === null || r.id > after)
                .slice(0, limit)
                .map(r => Object.fromEntries(cols.map(c => [c, r[c] ?? null])));
            return { data: rows, error: null };
        };
        const q: any = {
            select: (s: string) => { cols = s.split(',').map(c => c.trim()); return q; },
            order: () => q,
            limit: (n: number) => { limit = n; return q; },
            gt: (_c: string, v: string) => { after = v; return q; },
            then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
            update: (update: Row) => ({
                eq: async (_c: string, id: string) => {
                    const row = t.rows.find(r => r.id === id);
                    Object.assign(row!, update);
                    writes.push({ table, id, update });
                    return { error: null };
                },
            }),
        };
        return q;
    };
    return { client: { from } as any, writes, tables };
}

const id = (n: number) => `id-${String(n).padStart(4, '0')}`;

describe('backfillTable', () => {
    function seed() {
        return fakeDb({
            click_events: {
                columns: ['id', 'ip_hash', 'ip_address'],
                rows: [
                    { id: id(1), ip_hash: '1.2.3.4' },                  // raw IP from process-click
                    { id: id(2), ip_hash: '1.2.3.4, 10.0.0.1' },        // raw forwarded list
                    { id: id(3), ip_hash: '0a1b2c3d' },                 // old 32-bit hash
                    { id: id(4), ip_hash: null, ip_address: '5.6.7.8' },// raw in ip_address
                    { id: id(5), ip_hash: null },                       // nothing to do
                    { id: id(6), ip_hash: 'unknown' },                  // no address
                ],
            },
            clicks: {
                columns: ['id', 'ip_address'],                         // older table, no ip_hash
                rows: [{ id: id(1), ip_address: '9.9.9.9' }, { id: id(2), ip_address: null }],
            },
        });
    }

    it('dry run counts changes without writing', async () => {
        const db = seed();
        const r = await backfillTable(db.client, 'click_events', SECRET, { pageSize: 2 });
        // rows 1-4 need hashing, and row 6 ('unknown') becomes null
        expect(r).toMatchObject({ scanned: 6, changed: 5, failed: 0 });
        expect(db.writes).toHaveLength(0);
    });

    it('rewrites every row across pages so no raw or weak value remains', async () => {
        const db = seed();
        await backfillTable(db.client, 'click_events', SECRET, { apply: true, pageSize: 2 });
        const rows = db.tables.click_events.rows;

        const visitor = await hashIp('1.2.3.4', SECRET);
        expect(rows.find(r => r.id === id(1))!.ip_hash).toBe(visitor);
        expect(rows.find(r => r.id === id(2))!.ip_hash).toBe(visitor); // same visitor, same hash
        expect(rows.find(r => r.id === id(3))!.ip_hash).toMatch(HMAC_HEX);
        expect(rows.find(r => r.id === id(4))).toMatchObject({ ip_hash: await hashIp('5.6.7.8', SECRET), ip_address: null });
        expect(rows.find(r => r.id === id(5))!.ip_hash).toBeNull();
        expect(rows.find(r => r.id === id(6))!.ip_hash).toBeNull();
    });

    it('is idempotent: a second run changes nothing', async () => {
        const db = seed();
        await backfillTable(db.client, 'click_events', SECRET, { apply: true, pageSize: 2 });
        const second = await backfillTable(db.client, 'click_events', SECRET, { apply: true, pageSize: 2 });
        expect(second.changed).toBe(0);
    });

    it('on a table without ip_hash, clears ip_address only', async () => {
        const db = seed();
        const r = await backfillTable(db.client, 'clicks', SECRET, { apply: true });
        expect(r.columns).toEqual(['ip_address']);
        expect(db.tables.clicks.rows.every(row => row.ip_address === null)).toBe(true);
        expect(db.writes.every(w => !('ip_hash' in w.update))).toBe(true);
    });

    it('skips a table that does not exist', async () => {
        const db = seed();
        expect(await backfillTable(db.client, 'no_such_table', SECRET, { apply: true })).toMatchObject({ skipped: true });
    });
});
