import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Cashfree } from 'cashfree-pg';

// Initialize Cashfree
// @ts-ignore
Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
// @ts-ignore
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
// @ts-ignore - Cashfree SDK typing issue
Cashfree.XEnvironment = process.env.VITE_APP_ENV === 'production'
    // @ts-ignore
    ? Cashfree.Environment?.PRODUCTION
    // @ts-ignore
    : Cashfree.Environment?.SANDBOX;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderAmount, customerId, customerPhone, customerName } = req.body;

        if (!orderAmount || !customerId || !customerPhone || !customerName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const request = {
            order_amount: orderAmount,
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone,
                customer_name: customerName,
            },
            order_meta: {
                return_url: `${req.headers.origin}/payment/success?order_id=${orderId}`,
                notify_url: `${req.headers.origin}/api/webhooks/cashfree`,
            },
            order_note: "Pro Plan Subscription",
        };

        // @ts-ignore
        const response = await Cashfree.PGCreateOrder('2023-08-01', request);
        const data = response.data;

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Cashfree Error:', error.response?.data?.message || error.message);
        return res.status(500).json({
            error: 'Failed to create order',
            details: error.response?.data?.message || error.message
        });
    }
}
