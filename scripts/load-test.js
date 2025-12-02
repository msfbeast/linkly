import { fileURLToPath } from 'url';

const TARGET_URL = process.argv[2];
const REQUESTS = 100; // Number of requests to simulate
const CONCURRENCY = 10; // Concurrent requests

if (!TARGET_URL) {
    console.error('Usage: node scripts/load-test.js <url>');
    process.exit(1);
}

console.log(`🚀 Starting Load Test: ${REQUESTS} requests to ${TARGET_URL}`);
console.log(`⚡ Concurrency: ${CONCURRENCY}`);

async function runTest() {
    let completed = 0;
    let success = 0;
    let edgeRedirects = 0;
    let originFallbacks = 0;
    let errors = 0;
    const start = Date.now();

    const batchSize = CONCURRENCY;

    for (let i = 0; i < REQUESTS; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < REQUESTS; j++) {
            batch.push(fetch(TARGET_URL, { redirect: 'manual' }).then(async (res) => {
                completed++;

                // 307/308/301/302 indicates Edge Redirect
                if (res.status >= 300 && res.status < 400) {
                    success++;
                    edgeRedirects++;
                }
                // 200 OK means it hit the Origin (React App) -> Fallback
                else if (res.status === 200) {
                    success++;
                    originFallbacks++;
                } else {
                    errors++;
                    console.error(`❌ Error: ${res.status}`);
                }

                process.stdout.write(`\rProgress: ${completed}/${REQUESTS}`);
            }).catch(err => {
                completed++;
                errors++;
                console.error('Request Failed:', err.message);
            }));
        }
        await Promise.all(batch);
    }

    const duration = (Date.now() - start) / 1000;

    console.log('\n\n📊 Results:');
    console.log(`----------------------------------------`);
    console.log(`⏱️  Duration:      ${duration.toFixed(2)}s`);
    console.log(`📈  RPS:           ${(REQUESTS / duration).toFixed(2)} req/s`);
    console.log(`✅  Successful:    ${success}`);
    console.log(`⚡  Edge Redirects:${edgeRedirects} (Target: 100%)`);
    console.log(`🐢  Origin Fallback:${originFallbacks} (Should be 0)`);
    console.log(`❌  Errors:        ${errors}`);
    console.log(`----------------------------------------`);

    if (edgeRedirects === REQUESTS) {
        console.log('🎉 SUCCESS: All requests handled by Edge!');
    } else if (originFallbacks > 0) {
        console.log('⚠️  WARNING: Some requests hit the Origin. Cache might be cold or misconfigured.');
    } else {
        console.log('❌ FAILURE: High error rate.');
    }
}

runTest();
