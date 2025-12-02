import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testWorker() {
    const workerUrl = 'http://localhost:3000/api/queue/process-click';
    console.log(`🧪 Testing Worker: ${workerUrl}`);

    // Mock event data
    const eventData = {
        linkId: '14011e4d-29fe-4eb1-87d7-d6a13232ff04', // Use the ID from previous verification
        timestamp: Date.now(),
        userAgent: 'Test Script',
        ip: '127.0.0.1',
        country: 'US',
        city: 'Test City',
        region: 'Test Region'
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
            body: JSON.stringify(eventData)
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
