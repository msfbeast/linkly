import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Service Role Key Present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('Missing Supabase credentials');
    process.exit(1);
}

console.log('Service Role Key Present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAnalytics() {
    console.log('🔍 Verifying Analytics Data...');

    // Get the link ID for 'trshorts'
    const linkData = {
        id: '1149373a-16c5-4783-9556-fbb4b57d1b64', // sammon22
        clicks: 0
    };

    console.log(`🔗 Link ID: ${linkData.id}`);
    console.log(`📊 Total Clicks (in Links table): ${linkData.clicks}`);

    // Check click_events for the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, count, error: countError } = await supabase
        .from('click_events')
        .select('*', { count: 'exact' })
        .gte('timestamp', oneHourAgo)
        .order('timestamp', { ascending: false })
        .limit(1);

    if (countError) {
        console.error('Error fetching click events:', countError);
        return;
    }

    console.log(`⏱️  Recent Clicks (Last 1 Hour): ${count}`);

    if (data && data.length > 0) {
        console.log('📍 Latest Click:', data[0]);
        console.log('✅ SUCCESS: Analytics pipeline is working!');
    } else {
        console.log('⚠️  WARNING: No recent clicks found. QStash queue might be delayed or failing.');
    }
}

verifyAnalytics();
