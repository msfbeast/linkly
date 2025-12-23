import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { planId, total_count, notes } = req.body;

        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        const options = {
            plan_id: planId,
            total_count: total_count || 120, // Default to 10 years (120 months) if not specified
            quantity: 1,
            customer_notify: 1 as 0 | 1,
            notes,
        };

        const subscription = await razorpay.subscriptions.create(options);

        res.status(200).json(subscription);
    } catch (error: any) {
        console.error('Razorpay Subscription Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
}
