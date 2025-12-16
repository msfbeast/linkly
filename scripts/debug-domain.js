
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDomain() {
    console.log('Checking domain: links.trak.in');

    const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', 'links.trak.in');

    if (error) {
        console.error('Error fetching domain:', error);
    } else {
        console.log('Domain Data:', JSON.stringify(data, null, 2));

        if (data.length === 0) {
            console.log('Domain NOT found in table.');
        } else {
            console.log('Domain found. Status:', data[0].status);
        }
    }
}

checkDomain();
