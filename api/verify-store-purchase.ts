import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Service Role for admin updates)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId, // Internal DB order ID
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // 2. Update Order Status.
        //    INTEGRITY: match BOTH the internal id AND the razorpay order id,
        //    and use .select() to confirm a row actually updated — previously
        //    a mismatched id updated nothing and we still reported success.
        const { data: updatedOrders, error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'paid',
                razorpay_payment_id: razorpay_payment_id,
            })
            .eq('id', orderId)
            .eq('razorpay_order_id', razorpay_order_id)
            .select('id, product_id, customer_email, amount, currency');

        if (updateError) {
            console.error('Order update error:', updateError);
            return res.status(500).json({ error: 'Failed to update order status' });
        }
        if (!updatedOrders || updatedOrders.length === 0) {
            console.error(`[Verify] No order matched id=${orderId} rz=${razorpay_order_id}`);
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = updatedOrders[0];

        // 3. Load the product from the ORDER row (never from the client —
        //    a client-sent productId could be swapped to download a different
        //    product than the one paid for).
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', order.product_id)
            .single();

        if (product) {
            await supabase
                .from('products')
                .update({ sales_count: (product.sales_count || 0) + 1 })
                .eq('id', product.id);
        }

        // 4. Generate signed download URL (bucket is PRIVATE — never emit
        //    /object/public/ URLs, they 404 and strand paying customers).
        let downloadUrl: string | undefined;
        if (product?.file_url) {
            if (product.file_url.startsWith('http')) {
                downloadUrl = product.file_url; // externally hosted file
            } else {
                const { data: signedData, error: signError } = await supabase
                    .storage
                    .from('digital-products')
                    .createSignedUrl(product.file_url, 60 * 60 * 24 * 7); // 7 days
                if (!signError && signedData) {
                    downloadUrl = signedData.signedUrl;
                } else {
                    console.error('[Verify] Failed to sign download URL:', signError);
                }
            }
        }

        // 5. Send Receipt Email (column is customer_email — the old code read
        //    buyer_email, which doesn't exist, so receipts never sent)
        if (order.customer_email) {
            try {
                const Resend = require('resend').Resend;
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gather Receipts <receipts@gather.link>';

                await resend.emails.send({
                    from: fromEmail,
                    to: order.customer_email,
                    subject: `Receipt for ${product?.name || 'Digital Product'}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Thank you for your purchase!</h1>
                            <p>Here is your receipt for <strong>${product?.name || 'your product'}</strong>.</p>
                            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Order ID:</strong> ${order.id}</p>
                                <p><strong>Amount:</strong> ${order.currency} ${order.amount}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                            ${downloadUrl ? `
                            <p>You can download your file or access your content using the link below:</p>
                            <a href="${downloadUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Content</a>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">This link expires in 7 days.</p>
                            ` : ''}
                            ${product?.image_url ? `<img src="${product.image_url}" style="width: 100%; border-radius: 8px; margin-top: 20px; max-height: 200px; object-fit: cover;" />` : ''}
                            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
                        </div>
                    `
                });
                console.log(`Receipt sent to ${order.customer_email}`);
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
                // Don't fail the verification request just because email failed
            }
        }

        return res.status(200).json({ success: true, message: 'Purchase verified', downloadUrl });

    } catch (error: any) {
        console.error('Verify Purchase Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
