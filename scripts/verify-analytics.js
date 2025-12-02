import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAnalytics() {
    console.log('🔍 Verifying Analytics Data...');

    // Get the link ID for 'trshorts'
    const { data: linkData, error: linkError } = await supabase
        .from('links')
        .select('id, clicks')
        .eq('short_code', 'X300CS')
        .single();

    if (linkError) {
        console.error('Error fetching link:', linkError);
        return;
    }

    console.log(`🔗 Link ID: ${linkData.id}`);
    console.log(`📊 Total Clicks (in Links table): ${linkData.clicks}`);

    // Check click_events for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
        .from('click_events')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', linkData.id)
        .gte('timestamp', oneHourAgo);

    if (countError) {
        console.error('Error fetching click events:', countError);
        return;
    }

    console.log(`⏱️  Recent Clicks (Last 1 Hour): ${count}`);

    if (count > 0) {
        console.log('✅ SUCCESS: Analytics pipeline is working!');
    } else {
        console.log('⚠️  WARNING: No recent clicks found. QStash queue might be delayed or failing.');
    }
}

verifyAnalytics();
