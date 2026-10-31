import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getAdminClient, getUserFromRequest } from './_lib/supabaseServer';
import { tierForPlan } from '../utils/razorpayPlans';

const ACTIVE_STATUSES = new Set(['authenticated', 'active']);

function safeEqualHex(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabase = getAdminClient();
    if (!keyId || !keySecret || !supabase) {
        console.error('[VerifySubscription] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body || {};

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Verify signature: hmac_sha256(payment_id + "|" + subscription_id)
        const expected = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (!safeEqualHex(expected, String(razorpay_signature))) {
            return res.status(400).json({ error: 'Invalid subscription signature' });
        }

        // 2. Fetch the subscription from Razorpay and check it belongs to
        //    this user. The tier is derived from the plan, not the request.
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const subscription: any = await razorpay.subscriptions.fetch(razorpay_subscription_id);

        if (subscription?.notes?.userId !== user.id) {
            return res.status(403).json({ error: 'Subscription does not belong to this user' });
        }
        if (!ACTIVE_STATUSES.has(subscription.status)) {
            return res.status(400).json({ error: `Subscription is ${subscription.status}` });
        }

        const tier = tierForPlan(subscription.plan_id);
        if (!tier) {
            return res.status(400).json({ error: 'Unknown plan' });
        }

        // 3. Update the caller's own profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscription_tier: tier,
                subscription_status: 'active',
                razorpay_subscription_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return res.status(500).json({
                error: 'Payment verified but failed to update subscription. Please contact support.',
                ref: razorpay_payment_id,
            });
        }

        return res.status(200).json({ success: true, tier });
    } catch (error: any) {
        console.error('Verify Subscription Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
