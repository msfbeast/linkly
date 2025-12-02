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

async function debugInsert() {
    console.log('🐞 Debugging DB Insert...');

    const testPayload = {
        link_id: '1149373a-16c5-4783-9556-fbb4b57d1b64', // sammon22
        timestamp: new Date().toISOString(),
        raw_user_agent: 'Debug Script',
        ip_hash: '127.0.0.1',
        country: 'TestCountry',
        city: 'TestCity',
        region: 'TestRegion',
        referrer: 'direct'
    };

    console.log('Attempting to insert:', testPayload);

    const { data, error } = await supabase
        .from('click_events')
        .insert(testPayload)
        .select();

    if (error) {
        console.error('❌ Insert Failed:', error);
        if (error.code === '42703') {
            console.error('👉 Cause: Column does not exist. The schema is missing location columns.');
        }
    } else {
        console.log('✅ Insert Successful!', data);
    }
}

debugInsert();
