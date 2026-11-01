import { Receiver } from '@upstash/qstash';
import { storeClick, clickStoreEnvFromProcess } from '../_lib/clickStore';

export const config = {
    runtime: 'edge',
};

const CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

// Initialize QStash Receiver
const receiver = new Receiver({
    currentSigningKey: CURRENT_SIGNING_KEY || '',
    nextSigningKey: NEXT_SIGNING_KEY || CURRENT_SIGNING_KEY || '',
});

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // Fail closed: without signing keys we can't tell QStash from anyone else.
    if (!CURRENT_SIGNING_KEY) {
        console.error('QStash signing keys not configured; rejecting click');
        return new Response('Server Configuration Error', { status: 500 });
    }

    const signature = request.headers.get('upstash-signature');
    if (!signature) {
        return new Response('Missing signature', { status: 401 });
    }

    const body = await request.text();
    try {
        const valid = await receiver.verify({ signature, body });
        if (!valid) throw new Error('invalid');
    } catch {
        return new Response('Invalid signature', { status: 401 });
    }

    try {
        const event = JSON.parse(body);
        const result = await storeClick(event, clickStoreEnvFromProcess());
        if (!result.ok) {
            console.error('Failed to store click:', result.error);
            // 500 makes QStash retry the delivery.
            return new Response('Database Error', { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Worker Error:', error);
        return new Response('Invalid Request', { status: 400 });
    }
}
