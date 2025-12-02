import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log('✅ Loaded .env.local. Keys found:', Object.keys(envConfig));
    const url = process.env.KV_REST_API_URL || '';
    console.log('KV_REST_API_URL start:', url.substring(0, 10));
    console.log('KV_REST_API_TOKEN present:', !!process.env.KV_REST_API_TOKEN);
} else {
    console.warn('⚠️ .env.local not found at:', envPath);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllLinks() {
    console.log('🔄 Starting full sync of links to Edge Cache...');

    // Use createClient to explicitly pass credentials
    const { createClient: createKvClient } = await import('@vercel/kv');
    const kv = createKvClient({
        url: process.env.KV_REST_API_URL ? process.env.KV_REST_API_URL.trim() : '',
        token: process.env.KV_REST_API_TOKEN ? process.env.KV_REST_API_TOKEN.trim() : '',
    });

    // Fetch all links
    const { data: links, error } = await supabase
        .from('links')
        .select('id, short_code, original_url');

    if (error) {
        console.error('Failed to fetch links:', error);
        process.exit(1);
    }

    console.log(`Found ${links.length} links. Syncing to Redis...`);

    let synced = 0;
    let errors = 0;

    for (const link of links) {
        if (link.short_code && link.original_url) {
            try {
                // Key: linkly:link:{shortCode}
                await kv.set(`linkly:link:${link.short_code}`, {
                    url: link.original_url,
                    id: link.id
                });
                synced++;
                process.stdout.write(`\rProgress: ${synced}/${links.length}`);
            } catch (err) {
                errors++;
                console.error(`\nFailed to sync ${link.short_code}:`, err);
            }
        }
    }

    console.log('\n\n✅ Sync Complete!');
    console.log(`Synced: ${synced}`);
    console.log(`Errors: ${errors}`);
}

syncAllLinks();
