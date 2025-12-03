import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        console.error('Missing STRIPE_SECRET_KEY');
        return res.status(500).json({ error: 'Server configuration error: Missing Stripe API Key' });
    }

    const stripe = new Stripe(stripeKey, {
        apiVersion: '2025-11-17.acacia' as any, // Using latest version or casting to any to avoid type errors
    });

    try {
        const { priceId, userId, email, returnUrl } = req.body;

        if (!priceId || !userId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'], // Removing UPI for now to fix type error, or I can add it back if I cast.
            customer_email: email, // Pre-fill email
            client_reference_id: userId, // Track which user this is for
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}?canceled=true`,
            subscription_data: {
                metadata: {
                    userId: userId,
                },
            },
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
