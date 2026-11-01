/**
 * One-off backfill: replace stored visitor IPs with keyed hashes.
 *
 * WHY: until recently clicks stored visitor IPs as
 *   - raw addresses in click_events.ip_hash (api/queue/process-click),
 *   - a 32-bit hash in click_events.ip_hash (track-click edge function),
 *     which can be reversed by trying every IPv4 address,
 *   - raw addresses in an ip_address column (the record_click DB function,
 *     on click_events, or on the older clicks table).
 * New clicks are now stored as an HMAC (utils/ipHash.ts). This rewrites the
 * old rows the same way, so the same visitor still hashes the same and
 * unique-visitor counts carry on working.
 *
 * WHAT IT DOES, per row of click_events and (if it exists) clicks:
 *   - ip_hash already an HMAC: left alone
 *   - ip_hash raw IP or old 32-bit hash: replaced with an HMAC of it
 *   - ip_address set: hashed into ip_hash if that is empty, then cleared
 * Rules live in scripts/lib/ipHashing.js and are unit-tested.
 *
 * USAGE:
 *   node scripts/hash-stored-ips.js            # dry run: counts what would change
 *   node scripts/hash-stored-ips.js --apply    # writes the changes
 *
 * REQUIRES in .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
 * IP_HASH_SALT set to the SAME value as in Vercel (and the track-click edge
 * function), or hashes won't match new clicks. If production has no
 * IP_HASH_SALT (it then falls back to the service role key), pass
 * --salt-is-service-key to do the same here.
 *
 * Safe to re-run: rows already hashed are skipped.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { backfillTable } from './lib/ipHashing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
} else {
    console.warn('⚠️ .env.local not found at:', envPath);
}

const APPLY = process.argv.includes('--apply');
const SALT_IS_SERVICE_KEY = process.argv.includes('--salt-is-service-key');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

let secret = process.env.IP_HASH_SALT;
if (!secret) {
    if (!SALT_IS_SERVICE_KEY) {
        console.error(
            'IP_HASH_SALT is not set in .env.local.\n' +
            'Set it to the same value as in Vercel. If production has no IP_HASH_SALT\n' +
            '(so it hashes with the service role key), re-run with --salt-is-service-key.'
        );
        process.exit(1);
    }
    secret = serviceKey;
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

console.log(APPLY ? 'Hashing stored IPs (APPLY)\n' : 'Dry run: nothing will be written. Re-run with --apply to write.\n');
let anyFailed = false;
for (const table of ['click_events', 'clicks']) {
    const r = await backfillTable(supabase, table, secret, {
        apply: APPLY,
        onProgress: ({ scanned, changed }) =>
            process.stdout.write(`  ${table}: scanned ${scanned}, ${APPLY ? 'updated' : 'would update'} ${changed}\r`),
    });
    if (r.skipped) {
        console.log(`- ${table}: table or IP columns not found, skipped`);
        continue;
    }
    console.log(`- ${table} (${r.columns.join(', ')}): scanned ${r.scanned}, ${APPLY ? 'updated' : 'would update'} ${r.changed}` +
        (r.failed ? `, ${r.failed} FAILED (first error: ${r.firstError})` : '') + '          ');
    if (r.failed) anyFailed = true;
}
console.log(anyFailed ? '\nFinished with failures; re-run to retry them.' : '\nDone.');
if (anyFailed) process.exitCode = 1;
