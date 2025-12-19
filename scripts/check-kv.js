import { createClient } from '@vercel/kv';

const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

async function checkKey() {
    const key = 'gather:link:trshorts';
    console.log(`Checking key: ${key}...`);
    try {
        const data = await kv.get(key);
        console.log('Data:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

checkKey();
