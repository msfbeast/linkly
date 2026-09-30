import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import { getUserFromRequest } from './_lib/supabaseServer';
import { tierForPlan } from '../utils/razorpayPlans';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('[Subscription] Razorpay env missing');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { planId } = req.body || {};

        // Only plans we know about can be subscribed to; the tier comes from
        // the plan, never from the client.
        const tier = tierForPlan(planId);
        if (!tier) {
            return res.status(400).json({ error: 'Unknown plan' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            total_count: 120, // 10 years of monthly cycles
            quantity: 1,
            customer_notify: 1,
            notes: { userId: user.id, tier },
        });

        res.status(200).json(subscription);
    } catch (error: any) {
        console.error('Razorpay Subscription Error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
}
