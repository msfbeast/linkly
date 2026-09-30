import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
import { getAdminClient } from './_lib/supabaseServer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabase = getAdminClient();
    if (!keyId || !keySecret || !supabase) {
        console.error('[StoreOrder] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    try {
        // Price, currency and seller always come from the product row —
        // never from the request body.
        const { productId, customerEmail, customerName } = req.body || {};

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ error: 'Missing productId' });
        }
        if (customerEmail !== undefined && customerEmail !== null && customerEmail !== '' &&
            (typeof customerEmail !== 'string' || !EMAIL_RE.test(customerEmail))) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, user_id, price, currency')
            .eq('id', productId)
            .maybeSingle();

        if (productError || !product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const price = Number(product.price);
        if (!Number.isFinite(price) || price <= 0) {
            return res.status(400).json({ error: 'Product is not purchasable' });
        }

        const currencyCode = product.currency || 'INR';
        const amountInSubunits = Math.round(price * 100);

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzOrder = await razorpay.orders.create({
            amount: amountInSubunits,
            currency: currencyCode,
            receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            payment_capture: true,
            notes: { productId: product.id, sellerId: product.user_id },
        });

        const { data: order, error: dbError } = await supabase
            .from('orders')
            .insert({
                seller_id: product.user_id,
                product_id: product.id,
                amount: price,
                currency: currencyCode,
                status: 'pending',
                razorpay_order_id: rzOrder.id,
                customer_email: customerEmail || null,
                customer_name: typeof customerName === 'string' ? customerName.slice(0, 200) : null,
            })
            .select('id')
            .single();

        if (dbError || !order) {
            console.error('DB Insert Error:', dbError);
            throw new Error('Failed to create local order record');
        }

        res.status(200).json({
            id: order.id,           // Internal ID
            rz_id: rzOrder.id,      // Razorpay Order ID
            amount: rzOrder.amount,
            currency: rzOrder.currency,
            key_id: keyId,
        });
    } catch (error: any) {
        console.error('Create Store Order Error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
}
