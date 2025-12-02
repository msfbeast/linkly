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

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address.');
    console.log('Usage: node scripts/approve-user.js <email>');
    process.exit(1);
}

async function approveUser() {
    console.log(`Searching for user: ${email}...`);
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found.');
        return;
    }

    if (user.email_confirmed_at) {
        console.log('User is already verified.');
        return;
    }

    console.log(`Approving user ${user.id}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (updateError) {
        console.error('Error approving user:', updateError);
    } else {
        console.log('✅ User approved successfully!');
    }
}

approveUser();
