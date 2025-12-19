import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const redisUrl = process.env.REDIS_URL;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

if (!redisUrl) {
    console.error('Missing REDIS_URL in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
// Strip quotes if present
const cleanRedisUrl = redisUrl.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
const redis = new Redis(cleanRedisUrl);

async function syncAllLinks() {
    console.log('Starting full link sync to Redis (via ioredis)...');

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
                    url: link.original_url,
                    id: link.id,
                    password: !!link.password_hash,
                    expiration: link.expiration_date ? new Date(link.expiration_date).getTime() : undefined,
                    start: link.start_date ? new Date(link.start_date).getTime() : undefined
                };

                // Write directly to Redis
                // Note: We must stringify the payload as ioredis expects a string for the value
                await redis.set(`gather:link:${link.short_code}`, JSON.stringify(payload));

                // console.log(`Synced ${link.short_code}`);
                totalSynced++;
            } catch (err) {
                console.error(`Error syncing ${link.short_code}:`, err);
            }
        }

        page++;
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Sync complete! Total links synced: ${totalSynced}`);

    // Verification Step
    if (totalSynced > 0) {
        console.log('Verifying last synced link...');
        const { data: lastLink } = await supabase
            .from('links')
            .select('short_code')
            .limit(1)
            .single();

        if (lastLink) {
            const val = await redis.get(`gather:link:${lastLink.short_code}`);
            if (val) {
                console.log(`✅ Verification SUCCESS: Retrieved data for ${lastLink.short_code}`);
            } else {
                console.error(`❌ Verification FAILED: Could not retrieve data for ${lastLink.short_code}`);
            }
        }
    }

    redis.disconnect();
}

// Handle Redis errors to prevent crash
redis.on('error', (err) => {
    if (err.message.includes('DB index is out of range')) {
        // Ignore DB index error if it works anyway (common with some cloud providers)
        return;
    }
    console.error('Redis Client Error:', err);
});

syncAllLinks().catch(async (err) => {
    console.error(err);
    redis.disconnect();
});
