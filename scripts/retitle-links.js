/**
 * Backfill readable titles for links titled "New Link" (or bare hostnames).
 *
 * WHY: the AI title fallback used to write "New Link" for every link when
 * analysis failed, leaving the dashboard unscannable. The fallback now
 * derives titles from the URL slug — this script applies the same logic
 * retroactively.
 *
 * USAGE:
 *   node scripts/retitle-links.js           # dry run
 *   node scripts/retitle-links.js --apply   # write changes
 *
 * REQUIRES in .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

// --- Mirrors utils/urlTitle.ts (kept in sync manually) ---
const KNOWN_HOSTS = {
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

const isOpaqueSegment = (seg) => {
    if (!seg) return true;
    if (/^[0-9]+$/.test(seg)) return true;
    if (/^[0-9a-f-]{16,}$/i.test(seg)) return true;
    if (/^[A-Za-z0-9_-]{15,}$/.test(seg) && !seg.includes('-')) return true;
    if (/^(index|home|p|dp|d|s|r|u|v|e)$/i.test(seg)) return true;
    const letters = (seg.match(/[a-z]/gi) || []).length;
    return letters < seg.length * 0.5;
};

const titleCase = (s) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

const cleanHostname = (hostname) => {
    const brand = hostname.replace(/^www\./, '').split('.')[0];
    return brand.charAt(0).toUpperCase() + brand.slice(1);
};

const titleFromUrl = (url, maxLength = 60) => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        if (KNOWN_HOSTS[host]) return KNOWN_HOSTS[host];

        const segments = parsed.pathname.split('/').filter(Boolean).filter(seg => !isOpaqueSegment(seg));
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
        return cleanHostname(parsed.hostname);
    } catch {
        return null; // don't overwrite with junk
    }
};

/** Titles considered placeholders worth replacing */
const isPlaceholderTitle = (title, url) => {
    if (!title || title === 'New Link' || title === 'Untitled Link') return true;
    try {
        const host = new URL(url).hostname;
        // bare hostname titles like "docs.google.com"
        if (title === host || title === host.replace(/^www\./, '')) return true;
    } catch { /* ignore */ }
    return false;
};

async function main() {
    console.log(`\n${APPLY ? '🔴 APPLY MODE' : '🟡 DRY RUN — pass --apply to write changes'}\n`);

    const { data: links, error } = await supabase
        .from('links')
        .select('id, short_code, title, original_url');

    if (error) {
        console.error('Failed to load links:', error.message);
        process.exit(1);
    }

    let updated = 0, skipped = 0, failed = 0;

    for (const link of links) {
        if (!isPlaceholderTitle(link.title, link.original_url)) { skipped++; continue; }

        const newTitle = titleFromUrl(link.original_url);
        if (!newTitle || newTitle === link.title) { skipped++; continue; }

        console.log(`  ${link.short_code}: "${link.title}" -> "${newTitle}"`);

        if (!APPLY) { updated++; continue; }

        const { error: updateError } = await supabase
            .from('links')
            .update({ title: newTitle })
            .eq('id', link.id);

        if (updateError) {
            console.error(`    ❌ ${updateError.message}`);
            failed++;
        } else {
            updated++;
        }
    }

    console.log(`\nDone. ${APPLY ? 'Updated' : 'Would update'}: ${updated}, skipped: ${skipped}, failed: ${failed}`);
}

main();
