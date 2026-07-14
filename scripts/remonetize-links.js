/**
 * Re-monetization sweep: retroactively injects affiliate tags into legacy links.
 *
 * WHY: affiliate tags are only injected at link CREATION time. Links created
 * before the owner configured their Amazon Associate tag / Flipkart affiliate
 * ID — or synced to KV before the monetization fixes — still point at
 * untagged URLs and earn nothing.
 *
 * WHAT IT DOES:
 *   1. Loads every link whose original_url is an Amazon/Flipkart URL.
 *   2. Loads each owner's affiliate config from profiles.
 *   3. If the URL is missing the tag (or has a different tag), rewrites it.
 *   4. Updates the DB row and re-syncs the KV cache entry.
 *
 * USAGE:
 *   node scripts/remonetize-links.js           # dry run (prints what would change)
 *   node scripts/remonetize-links.js --apply   # actually writes changes
 *
 * REQUIRES in .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                         KV_REST_API_URL, KV_REST_API_TOKEN
 */

import { createClient } from '@supabase/supabase-js';
import { createClient as createKvClient } from '@vercel/kv';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
} else {
    console.warn('⚠️ .env.local not found at:', envPath);
}

const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

const kv = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    ? createKvClient({
        url: process.env.KV_REST_API_URL.trim(),
        token: process.env.KV_REST_API_TOKEN.trim(),
    })
    : null;

// --- Mirrors utils/affiliateUtils.ts monetizeUrl (kept in sync manually) ---
const monetizeUrl = (url, config) => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        const amazonTag = config.amazonAssociateTag?.trim();
        const flipkartId = config.flipkartAffiliateId?.trim();

        if (hostname === 'flipkart.com' || hostname.endsWith('.flipkart.com')) {
            if (flipkartId) {
                urlObj.searchParams.set('affid', flipkartId);
                return urlObj.toString();
            }
            return url;
        }

        if (hostname === 'amazon.com' || hostname === 'amazon.in' ||
            hostname.endsWith('.amazon.com') || hostname.endsWith('.amazon.in')) {
            if (amazonTag) {
                urlObj.searchParams.set('tag', amazonTag);
                return urlObj.toString();
            }
        }
        return url;
    } catch {
        return url;
    }
};

const isAffiliateTarget = (url) => {
    try {
        const h = new URL(url).hostname.replace('www.', '');
        return h.includes('amazon.com') || h.includes('amazon.in') || h.includes('flipkart.com');
    } catch {
        return false;
    }
};

async function main() {
    console.log(`\n${APPLY ? '🔴 APPLY MODE — changes will be written' : '🟡 DRY RUN — pass --apply to write changes'}\n`);

    // 1. Load all candidate links
    const { data: links, error } = await supabase
        .from('links')
        .select('id, user_id, short_code, original_url, password_hash, expiration_date, start_date')
        .or('original_url.ilike.%amazon.in%,original_url.ilike.%amazon.com%,original_url.ilike.%flipkart.com%');

    if (error) {
        console.error('Failed to load links:', error.message);
        process.exit(1);
    }
    console.log(`Found ${links.length} Amazon/Flipkart links`);

    // 2. Load affiliate configs for all owners in one query
    const userIds = [...new Set(links.map(l => l.user_id).filter(Boolean))];
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, amazon_associate_tag, flipkart_affiliate_id')
        .in('id', userIds);

    if (profileError) {
        console.error('Failed to load profiles:', profileError.message);
        process.exit(1);
    }
    const configByUser = Object.fromEntries(profiles.map(p => [p.id, {
        amazonAssociateTag: p.amazon_associate_tag,
        flipkartAffiliateId: p.flipkart_affiliate_id,
    }]));

    let updated = 0, skipped = 0, failed = 0;

    for (const link of links) {
        const config = configByUser[link.user_id];
        if (!config || (!config.amazonAssociateTag && !config.flipkartAffiliateId)) {
            skipped++;
            continue; // owner has no affiliate config
        }
        if (!isAffiliateTarget(link.original_url)) {
            skipped++;
            continue;
        }

        const monetized = monetizeUrl(link.original_url, config);
        if (monetized === link.original_url) {
            skipped++; // already tagged correctly
            continue;
        }

        console.log(`  ${link.short_code}:`);
        console.log(`    before: ${link.original_url}`);
        console.log(`    after:  ${monetized}`);

        if (!APPLY) { updated++; continue; }

        // 3. Update DB
        const { error: updateError } = await supabase
            .from('links')
            .update({ original_url: monetized })
            .eq('id', link.id);

        if (updateError) {
            console.error(`    ❌ DB update failed: ${updateError.message}`);
            failed++;
            continue;
        }

        // 4. Re-sync KV
        if (kv) {
            try {
                await kv.set(`gather:link:${link.short_code}`, {
                    url: monetized,
                    id: link.id,
                    password: !!link.password_hash,
                    expiration: link.expiration_date ?? undefined,
                    start: link.start_date ?? undefined,
                });
            } catch (kvError) {
                console.error(`    ⚠️ KV sync failed (DB updated): ${kvError.message}`);
            }
        }
        updated++;
    }

    console.log(`\nDone. ${APPLY ? 'Updated' : 'Would update'}: ${updated}, skipped (already tagged/no config): ${skipped}, failed: ${failed}`);
    if (!kv) console.log('⚠️ KV credentials missing — run scripts/sync-all-links.js afterwards to refresh the cache.');
}

main();
