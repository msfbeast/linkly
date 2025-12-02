import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function listUnverifiedUsers() {
    console.log('Fetching unverified users...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const unverified = users.filter(u => !u.email_confirmed_at);

    if (unverified.length === 0) {
        console.log('No unverified users found.');
    } else {
        console.log('\nUnverified Users:');
        unverified.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.id}) - Created: ${new Date(u.created_at).toLocaleString()}`);
        });
        console.log('\nTo approve a user, run: node scripts/approve-user.js <email>');
    }
}

listUnverifiedUsers();
