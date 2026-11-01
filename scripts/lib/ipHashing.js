import { createHmac } from 'crypto';

/**
 * Node copy of utils/ipHash.ts, for one-off scripts that run outside the
 * app. utils/__tests__/ipHash.test.ts checks the two give identical output.
 */

export function normalizeIp(raw) {
    if (typeof raw !== 'string') return null;
    const ip = raw.split(',')[0].trim();
    if (!ip || ip.toLowerCase() === 'unknown') return null;
    return ip;
}

export function hmacIp(ip, secret) {
    return createHmac('sha256', secret).update(ip).digest('hex');
}

const HMAC_HEX = /^[0-9a-f]{64}$/;

/**
 * Decide what a click_events row should hold.
 *
 * - ip_hash already an HMAC (64 hex chars): keep it.
 * - ip_hash holds anything else: a raw IP from before hashing was added, or
 *   a 32-bit hash from the old track-click function (reversible by trying
 *   every IPv4 address). HMAC it, so it can no longer be reversed.
 * - ip_address holds a raw IP: use it for ip_hash if that is empty, then
 *   clear it.
 *
 * Returns the update to apply, or null when the row is already clean.
 */
export function planRowUpdate(row, secret) {
    const update = {};
    const hash = typeof row.ip_hash === 'string' ? row.ip_hash : null;
    const address = typeof row.ip_address === 'string' && row.ip_address !== '' ? row.ip_address : null;

    if (hash !== null && !HMAC_HEX.test(hash)) {
        const source = normalizeIp(hash);
        update.ip_hash = source ? hmacIp(source, secret) : null;
    } else if (hash === null && address !== null) {
        const source = normalizeIp(address);
        if (source) update.ip_hash = hmacIp(source, secret);
    }

    if (address !== null) update.ip_address = null;

    return Object.keys(update).length ? update : null;
}

/** Which of ip_hash / ip_address exist on a table, or null if the table doesn't. */
export async function detectIpColumns(supabase, table) {
    for (const cols of [['ip_hash', 'ip_address'], ['ip_hash'], ['ip_address']]) {
        const { error } = await supabase.from(table).select(['id', ...cols].join(', ')).limit(1);
        if (!error) return cols;
        const msg = error.message || '';
        if (error.code === '42703' || /column .* does not exist/i.test(msg)) continue;
        if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(msg)) return null;
        throw new Error(`${table}: ${msg}`);
    }
    return null;
}

/**
 * Walk a table in id order and apply planRowUpdate to every row.
 * Writes only when `apply` is true. Returns counts.
 */
export async function backfillTable(supabase, table, secret, { apply = false, pageSize = 1000, concurrency = 10, onProgress } = {}) {
    const cols = await detectIpColumns(supabase, table);
    if (!cols) return { table, skipped: true, scanned: 0, changed: 0, failed: 0 };

    let lastId = null;
    let scanned = 0;
    let changed = 0;
    let failed = 0;
    let firstError = null;

    for (;;) {
        let query = supabase
            .from(table)
            .select(['id', ...cols].join(', '))
            .order('id', { ascending: true })
            .limit(pageSize);
        if (lastId !== null) query = query.gt('id', lastId);

        const { data: rows, error } = await query;
        if (error) throw new Error(`${table}: ${error.message}`);
        if (!rows || rows.length === 0) break;

        scanned += rows.length;
        lastId = rows[rows.length - 1].id;

        const updates = [];
        for (const row of rows) {
            const plan = planRowUpdate(row, secret);
            if (!plan) continue;
            // Only write columns this table actually has.
            const update = Object.fromEntries(Object.entries(plan).filter(([k]) => cols.includes(k)));
            if (Object.keys(update).length) updates.push({ id: row.id, update });
        }

        if (!apply) {
            changed += updates.length;
        } else {
            let next = 0;
            await Promise.all(Array.from({ length: concurrency }, async () => {
                while (next < updates.length) {
                    const { id, update } = updates[next++];
                    const { error: updateError } = await supabase.from(table).update(update).eq('id', id);
                    if (updateError) {
                        failed++;
                        firstError ??= updateError.message || String(updateError);
                    } else {
                        changed++;
                    }
                }
            }));
        }

        onProgress?.({ table, scanned, changed, failed });
        if (rows.length < pageSize) break;
    }

    return { table, skipped: false, columns: cols, scanned, changed, failed, firstError };
}
