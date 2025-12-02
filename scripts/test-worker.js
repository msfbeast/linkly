import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testWorker() {
    const workerUrl = 'http://localhost:3000/api/queue/process-click';
    console.log(`🧪 Testing Worker: ${workerUrl}`);

    // Mock event data
    const payload = {
        linkId: '34eea755-e564-4716-94fe-ceaedfe0f233', // Use the known link ID
        timestamp: Date.now(),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ip: '127.0.0.1',
        referrer: 'https://google.com',
        country: 'US',
        city: 'New York',
        region: 'NY'
    };

    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We are NOT sending a signature, so we expect a 401.
                // If we get 404, the route is wrong.
                // If we get 500, the worker crashed early.
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Response: ${text}`);

        if (response.status === 401 && text.includes('Missing signature')) {
            console.log('✅ Worker is reachable and checking signatures (Good).');
        } else if (response.status === 200) {
            console.log('⚠️  Worker accepted request without signature (Security Risk, but functional).');
        } else {
            console.log('❌ Worker returned unexpected status.');
        }

    } catch (error) {
        console.error('Request failed:', error);
    }
}

testWorker();
