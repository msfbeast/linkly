import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-ignore - Using latest API version
    apiVersion: '2025-01-27.acacia',
});

// Initialize Supabase (Service Role for admin access)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Disable body parsing to get raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

async function buffer(readable: any) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return res.status(400).json({ error: 'Missing signature or secret' });
    }

    let event: Stripe.Event;

    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, sig as string, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (userId) {
                    // Update user profile with subscription details
                    await supabase
                        .from('profiles')
                        .update({
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            subscription_status: 'active',
                            // Determine tier based on price ID or metadata (simplified for now)
                            subscription_tier: 'pro',
                        })
                        .eq('id', userId);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: subscription.status,
                        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Downgrade to free
                await supabase
                    .from('profiles')
                    .update({
                        subscription_status: 'canceled',
                        subscription_tier: 'free',
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('Webhook Handler Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
