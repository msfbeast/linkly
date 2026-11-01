import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getAdminClient } from '../_lib/supabaseServer';
import { isSubscriptionEvent, profileUpdateForEvent } from '../_lib/razorpaySubscriptionEvents';

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

        if (isSubscriptionEvent(event.event)) {
            const subscription = event.payload?.subscription?.entity;
            // notes.userId is set server-side in create-razorpay-subscription.
            const userId = subscription?.notes?.userId;
            if (!userId) {
                console.warn(`[Razorpay Webhook] Ignoring ${event.event}: no user on subscription`, subscription?.id);
                return res.status(200).json({ status: 'ignored' });
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('razorpay_subscription_id')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) {
                console.error('[Razorpay Webhook] Failed to load profile:', profileError);
                return res.status(500).json({ error: 'Failed to load profile' });
            }
            if (!profile) {
                console.warn(`[Razorpay Webhook] Ignoring ${event.event}: no profile for user`, userId);
                return res.status(200).json({ status: 'ignored' });
            }

            const update = profileUpdateForEvent(event.event, subscription, profile.razorpay_subscription_id);
            if (!update) {
                console.warn(`[Razorpay Webhook] Ignoring ${event.event} for ${subscription?.id}: unknown plan or not the current subscription`);
                return res.status(200).json({ status: 'ignored' });
            }

            const { error } = await supabase
                .from('profiles')
                .update({ ...update, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) {
                console.error('[Razorpay Webhook] Failed to update subscription:', error);
                return res.status(500).json({ error: 'Failed to update subscription' });
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
