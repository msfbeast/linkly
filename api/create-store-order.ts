import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Initialize Supabase (Service Role)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { productId, amount, currency, sellerId, customerEmail, customerName } = req.body;

        if (!productId || !amount || !sellerId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Create Razorpay Order
        const payment_capture = 1;
        const currencyCode = currency || 'USD';

        // Razorpay expects integer amount (subunits)
        // Check if currency is zero-decimal or not. Generally * 100 for USD/INR/EUR.
        const amountInSubunits = Math.round(amount * 100);

        const options = {
            amount: amountInSubunits,
            currency: currencyCode,
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            payment_capture,
            notes: {
                productId,
                sellerId
            }
        };

        const rzOrder = await razorpay.orders.create(options);

        // 2. Insert into Supabase 'orders' table
        const { data: order, error: dbError } = await supabase
            .from('orders')
            .insert({
                seller_id: sellerId,
                product_id: productId,
                amount: amount,
                currency: currencyCode,
                status: 'pending',
                razorpay_order_id: rzOrder.id,
                customer_email: customerEmail, // Optional (captured from UI if available)
                customer_name: customerName,   // Optional
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            throw new Error('Failed to create local order record');
        }

        // 3. Return combined data
        res.status(200).json({
            id: order.id,           // Internal ID
            rz_id: rzOrder.id,      // Razorpay Order ID
            amount: rzOrder.amount,
            currency: rzOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Create Store Order Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
}
