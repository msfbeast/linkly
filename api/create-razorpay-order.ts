import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

// Initialize Razorpay
// Note: In production, these should be environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, currency, receipt, notes } = req.body;

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency,
            receipt,
            notes,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json(order);
    } catch (error: any) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
}
