import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Admin client needed for updating subscription)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            userId,
            tier
        } = req.body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !userId || !tier) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Verify Signature for Subscription
        // Expected signature format: hmac_sha256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
        const expected_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (expected_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid subscription signature' });
        }

        // 2. Update Supabase User
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscription_tier: tier,
                subscription_status: 'active',
                // subscription_id: razorpay_subscription_id, // Recommended to store this for cancellation
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return res.status(500).json({
                error: 'Payment verified but failed to update subscription. Please contact support.',
                ref: razorpay_payment_id
            });
        }

        console.log(`Subscription verified for user ${userId} to ${tier} with sub_id ${razorpay_subscription_id}`);

        return res.status(200).json({ success: true, message: 'Subscription activated' });

    } catch (error: any) {
        console.error('Verify Subscription Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
