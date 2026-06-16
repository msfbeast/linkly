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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (need Service Role Key to fetch Auth users)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUser() {
    console.log('--- Checking Auth User ---');
    const { data: { user }, error } = await supabase.auth.admin.getUserById('d6f1b815-2c88-4555-8ca1-5e7d581affd6');

    if (error) {
        console.error('Error fetching Auth user:', error);
    } else {
        console.log('Auth User metadata:', user?.user_metadata);
    }
}

checkAuthUser();
