import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Reverting to version expected by installed library
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { priceId, userId, email, returnUrl } = req.body;

        if (!priceId || !userId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
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
