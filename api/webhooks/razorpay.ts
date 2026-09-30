import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getAdminClient } from '../_lib/supabaseServer';
import { tierForPlan } from '../../utils/razorpayPlans';

// Raw body is required: the signature is computed over the exact bytes
// Razorpay sent, which JSON.stringify(req.body) does not reproduce.
export const config = {
    api: {
        bodyParser: false,
    },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const supabase = getAdminClient();
    if (!secret || !supabase) {
        console.error('[Razorpay Webhook] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    try {
        const rawBody = await readRawBody(req);
        const signature = req.headers['x-razorpay-signature'];
        if (typeof signature !== 'string') {
            return res.status(400).json({ error: 'Missing signature' });
        }

        const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const a = Buffer.from(digest, 'utf8');
        const b = Buffer.from(signature, 'utf8');
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            console.warn('[Razorpay Webhook] Invalid signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody.toString('utf8'));

        if (event.event === 'subscription.charged' || event.event === 'subscription.activated') {
            const subscription = event.payload?.subscription?.entity;
            // notes.userId is set server-side in create-razorpay-subscription;
            // the tier always comes from the plan that was actually paid for.
            const userId = subscription?.notes?.userId;
            const tier = tierForPlan(subscription?.plan_id);

            if (userId && tier) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: tier,
                        subscription_status: 'active',
                        razorpay_subscription_id: subscription.id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', userId);

                if (error) {
                    console.error('[Razorpay Webhook] Failed to update user tier:', error);
                    return res.status(500).json({ error: 'Failed to update subscription' });
                }
            } else {
                console.warn(`[Razorpay Webhook] Ignoring ${event.event}: unknown plan or user`, subscription?.id);
            }
        }
        // payment.captured no longer changes plans: one-off orders carry no
        // tier, and upgrades only happen through verified subscriptions.

        res.status(200).json({ status: 'ok' });
    } catch (error: any) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
