const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getUser() {
    try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        const user = data.users.find(u => u.email === 'msfconsole007@gmail.com');
        if (user) {
            console.log('USER_ID:' + user.id);
        } else {
            console.log('User not found among ' + data.users.length + ' users');
        }
    } catch (e) {
        console.error('ERROR:' + e.message);
    }
}
getUser();
