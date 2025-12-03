import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllLinks() {
    console.log('Starting full link sync...');

    let page = 0;
    const pageSize = 100;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching links:', error);
            break;
        }

        if (!links || links.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Processing batch ${page + 1} (${links.length} links)...`);

        for (const link of links) {
            if (!link.short_code || !link.original_url) continue;

            try {
                const payload = {
                    shortCode: link.short_code,
                    originalUrl: link.original_url,
                    id: link.id,
                    password: !!link.password_hash,
                    expiration: link.expiration_date ? new Date(link.expiration_date).getTime() : undefined,
                    start: link.start_date ? new Date(link.start_date).getTime() : undefined
                };

                const response = await fetch(`${appUrl}/api/link/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    console.error(`Failed to sync ${link.short_code}: ${response.statusText}`);
                } else {
                    // console.log(`Synced ${link.short_code}`);
                }
                totalSynced++;
            } catch (err) {
                console.error(`Error syncing ${link.short_code}:`, err);
            }
        }

        page++;
        // Rate limiting to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Sync complete! Total links synced: ${totalSynced}`);
}

syncAllLinks().catch(console.error);
