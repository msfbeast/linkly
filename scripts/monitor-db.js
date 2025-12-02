import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try Service Role Key first, then Anon Key (though Anon won't work for count if RLS is on)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function monitor() {
    console.log('📊 Monitoring Click Events...');
    console.log('Press Ctrl+C to stop');
    console.log('----------------------------------------');
    console.log('Time\t\tTotal Clicks\tRate (clicks/sec)');

    let lastCount = 0;
    let lastTime = Date.now();

    // Initial count
    const { count: initialCount } = await supabase
        .from('click_events')
        .select('*', { count: 'exact', head: true });

    lastCount = initialCount || 0;
    console.log(`${new Date().toLocaleTimeString()}\t${lastCount}\t\t-`);

    setInterval(async () => {
        const { count, error } = await supabase
            .from('click_events')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error:', error.message);
            return;
        }

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const countDiff = (count || 0) - lastCount;
        const rate = countDiff / timeDiff;

        console.log(`${new Date().toLocaleTimeString()}\t${count}\t\t${rate.toFixed(1)}`);

        lastCount = count || 0;
        lastTime = now;
    }, 2000);
}

monitor();
