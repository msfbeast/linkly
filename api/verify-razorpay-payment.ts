import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Admin client needed for updating subscription)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            tier // 'pro' or 'business'
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !tier) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // 2. Calculate dates
        // Basic logic: 30 days subscription
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // 3. Update Supabase User
        // Note: Using 'profiles' or 'users' table? Typically 'profiles' has subscription data
        // Checking schemas mentioned earlier... UserProfile type has subscription_tier, subscription_status

        // We update the public.profiles table
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscription_tier: tier,
                subscription_status: 'active',
                subscription_period_end: periodEnd.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            // Payment succeeded but DB update failed - CRITICAL
            // In production, we should log this to an error reporting service or queue a retry
            return res.status(500).json({
                error: 'Payment verified but failed to update subscription. Please contact support.',
                ref: razorpay_payment_id
            });
        }

        // 4. Record Transaction (Optional - assuming 'transactions' table exists or skipping for MVP)
        // For now, logging success
        console.log(`Subscription updated for user ${userId} to ${tier}`);

        return res.status(200).json({ success: true, message: 'Subscription activated' });

    } catch (error: any) {
        console.error('Verify Payment Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
