import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLink() {
    const { data, error } = await supabase
        .from('links')
        .select('id, short_code, original_url')
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('ID:', data.id);
        console.log('Short Code:', data.short_code);
        console.log('Target:', data.original_url);
    }
}

getLink();
