
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testApi() {
    console.log('🧪 Starting API Test...');

    // 1. Create a Test User & Key (mocking what the UI does)
    // We'll just grab an existing user to attach the key to
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users.users.length) {
        console.error('Failed to list users or no users found:', userError);
        return;
    }
    const user = users.users[0];
    console.log(`👤 Using user: ${user.email} (${user.id})`);

    // Generate a real key
    const API_KEY = 'ga_live_test_key_123';
    const prefix = 'ga_live_';
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const secretPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const secretKey = `${prefix}${secretPart}`;

    // Hash it
    const encoder = new TextEncoder();
    const data = encoder.encode(secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insert into DB
    const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
            user_id: user.id,
            name: 'Automated Test Key',
            key_hash: keyHash,
            prefix: secretKey.substring(0, 12) + '...',
            scopes: ['links:read'],
        });

    if (insertError) {
        console.error('Failed to insert test key:', insertError);
        return;
    }
    console.log('🔑 Generated Test Key:', secretKey);

    // 2. Call the API (Simulating external client)
    // Note: We need the local dev server running for this to work on localhost, 
    // OR we can test against the production URL if deployed.
    // Since we just fixed it locally, we should try to invoke the handler directly
    // or assume the user wants to test the *logic*. 

    // Actually, calling the HTTP endpoint requires the app to be running.
    // I can't guarantee `localhost:5173` is up. 
    // BUT I can test the `handler` function directly if I import it!

    // Limitation: importing `api/v1/links.ts` might be tricky with node due to imports.
    // Let's rely on standard fetch to the production URL if available, or localhost.

    const API_URL = 'http://localhost:3000/api/v1/links';
    console.log(`🚀 Sending POST request to ${API_URL}...`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://example.com/api-test',
                title: 'API Test Link',
                tags: ['test']
            })
        });

        const text = await response.text();
        console.log(`STATUS: ${response.status}`);
        console.log(`RESPONSE: ${text}`);

        if (response.ok) {
            console.log('✅ API Test Passed!');
        } else {
            console.error('❌ API Test Failed');
        }

    } catch (e) {
        console.error('❌ Network Error (Server likely not running):', e.message);
        console.log('⚠️ Please ensure "npm run dev" is running in another terminal.');
    }

    // 3. Cleanup
    console.log('🧹 Cleaning up test key...');
    await supabase.from('api_keys').delete().eq('key_hash', keyHash);
}

testApi();
