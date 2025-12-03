import fetch from 'node-fetch';
import https from 'https';

const BASE_URL = 'https://linkly-30dfgjvz5-arunpds-projects.vercel.app'; // Production URL
const CUSTOM_DOMAIN = 'links.trak.in';
const TOTAL_REQUESTS = 30; // Enough to trigger the 20/10s limit
const CONCURRENCY = 5;

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function runTest() {
    console.log(`🚀 Starting Load Test v2 against ${BASE_URL}`);
    console.log(`🎯 Target: Rate Limiting & Custom Domains`);

    // 1. Test Rate Limiting
    console.log('\n--- Test 1: Rate Limiting (Spike Traffic) ---');
    let successCount = 0;
    let limitedCount = 0;
    let errorCount = 0;

    const requests = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);

    // Process in chunks to simulate concurrency
    for (let i = 0; i < requests.length; i += CONCURRENCY) {
        const chunk = requests.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(async (id) => {
            try {
                const start = Date.now();
                const res = await fetch(`${BASE_URL}/`, { // Use root path
                    headers: {
                        'x-forwarded-for': '1.2.3.4' // Simulate a single IP
                    },
                    agent
                });
                const duration = Date.now() - start;

                if (res.status === 200) {
                    successCount++;
                    process.stdout.write('.');
                } else if (res.status === 429) {
                    limitedCount++;
                    process.stdout.write('x');
                } else {
                    errorCount++;
                    process.stdout.write('!');
                }
            } catch (e) {
                errorCount++;
                process.stdout.write('E');
            }
        }));
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n\n📊 Rate Limiting Results:');
    console.log(`✅ Success (200 OK): ${successCount}`);
    console.log(`🛑 Limited (429): ${limitedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (limitedCount > 0) {
        console.log('✅ Rate Limiting is WORKING (Requests were blocked)');
    } else {
        console.log('⚠️ Rate Limiting might NOT be active (No requests blocked)');
    }

    // Wait for rate limit to reset
    console.log('\n⏳ Waiting 10s for rate limit reset...');
    await new Promise(r => setTimeout(r, 10000));

    // 2. Test Custom Domain Routing
    console.log('\n--- Test 2: Custom Domain Routing ---');
    try {
        const res = await fetch(`${BASE_URL}/trshorts`, {
            headers: {
                'Host': CUSTOM_DOMAIN
            },
            agent
        });

        console.log(`Request to ${CUSTOM_DOMAIN}/trshorts`);
        console.log(`Status: ${res.status}`);

        // We expect a rewrite, so the status should be 200 (or 307 if it redirects)
        // If middleware works, it should treat it as a valid request
        if (res.status === 200 || res.status === 307) {
            console.log('✅ Custom Domain Routing is WORKING');
        } else {
            console.log(`❌ Custom Domain Routing FAILED (Status: ${res.status})`);
        }

    } catch (e) {
        console.error('Error testing custom domain:', e);
    }
}

runTest();
