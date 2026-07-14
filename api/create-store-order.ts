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
        const { productId, customerEmail, customerName } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Missing required field: productId' });
        }

        // 1. PRICE INTEGRITY: derive amount/currency/seller from the DATABASE,
        //    never from the client. (Previously the client sent `amount`,
        //    which allowed buying any product for any price.)
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, user_id, name, price, currency')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (!product.price || product.price <= 0) {
            return res.status(400).json({ error: 'Product is not purchasable' });
        }

        const currencyCode = product.currency || 'INR';
        const amountInSubunits = Math.round(product.price * 100);

        // 2. Create Razorpay Order
        const options = {
            amount: amountInSubunits,
            currency: currencyCode,
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            payment_capture: 1,
            notes: {
                productId: product.id,
                sellerId: product.user_id,
            }
        };

        const rzOrder = await razorpay.orders.create(options);

        // 3. Insert into Supabase 'orders' table
        const { data: order, error: dbError } = await supabase
            .from('orders')
            .insert({
                seller_id: product.user_id,
                product_id: product.id,
                amount: product.price,
                currency: currencyCode,
                status: 'pending',
                razorpay_order_id: rzOrder.id,
                customer_email: customerEmail,
                customer_name: customerName,
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            throw new Error('Failed to create local order record');
        }

        // 4. Return combined data
        res.status(200).json({
            id: order.id,           // Internal ID
            rz_id: rzOrder.id,      // Razorpay Order ID
            amount: rzOrder.amount, // In subunits
            currency: rzOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            product_name: product.name,
        });

    } catch (error: any) {
        console.error('Create Store Order Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
}
