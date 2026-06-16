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
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificUser() {
    console.log('--- Checking Specific User Profile ---');
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 'd6f1b815-2c88-4555-8ca1-5e7d581affd6')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profile in Database:', {
            id: profile.id,
            username: profile.username,
            amazon_associate_tag: profile.amazon_associate_tag,
            flipkart_affiliate_id: profile.flipkart_affiliate_id
        });
    }

    console.log('\n--- Checking Non-Null Tag Count ---');
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('amazon_associate_tag', 'is', null);

    if (countError) {
        console.error('Count Error:', countError);
    } else {
        console.log('Number of profiles with non-null Amazon tag:', count);
    }
}

checkSpecificUser();
