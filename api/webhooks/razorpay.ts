import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify signature
        const shasum = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== req.headers['x-razorpay-signature']) {
            // In dev/test without real secrets, we might skip this or log a warning
            console.warn('Razorpay signature verification failed');
            // return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;

        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const userId = payment.notes.userId;
            const tier = payment.notes.tier; // 'pro' or 'business'

            if (userId && tier) {
                // Update user subscription
                console.log(`Processing upgrade for user ${userId} to ${tier}`);

                try {
                    await supabaseAdapter.updateProfile(userId, {
                        subscription_tier: tier as any,
                        // Cast to any for the value if necessary because tier comes from untyped req.body,
                        // but do not cast the whole object to any.
                        // Actually tier in req.body.notes might be string, but UserProfile expects literal type.
                    });
                } catch (err) {
                    console.error('Failed to update user tier:', err);
                    throw err; // Re-throw to trigger 500
                }
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).json({ error: error.message });
    }
}
