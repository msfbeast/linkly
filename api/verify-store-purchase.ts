import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';
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
            productId
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId || !productId) {
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

        // 2. Update Order Status
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'paid',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id // Ensure this is saved if not already
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Order update error:', updateError);
            return res.status(500).json({ error: 'Failed to update order status' });
        }

        // 3. Increment Sales Count & Fetch Details for Email
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (product) {
            await supabase
                .from('products')
                .update({ sales_count: (product.sales_count || 0) + 1 })
                .eq('id', productId);
        }

        // 4. Send Receipt Email
        // Fetch order details to get buyer email
        const { data: order } = await supabase
            .from('orders')
            .select('buyer_email, amount, currency')
            .eq('id', orderId)
            .single();

        if (order?.buyer_email) {
            try {
                // Generate Secure Download Link
                let downloadUrl = product?.file_url || '#';

                // If it's a storage path (not an external URL), sign it
                if (downloadUrl && !downloadUrl.startsWith('http')) {
                    const { data: signedData, error: signError } = await supabase
                        .storage
                        .from('digital-products')
                        .createSignedUrl(downloadUrl, 60 * 60 * 24 * 7); // 7 days expiry

                    if (!signError && signedData) {
                        downloadUrl = signedData.signedUrl;
                    } else {
                        console.warn('[Verify] Failed to sign URL:', signError);
                        // Fallback: Construct public URL if bucket is public
                        const { data: publicData } = supabase.storage.from('digital-products').getPublicUrl(downloadUrl);
                        downloadUrl = publicData.publicUrl;
                    }
                }

                const Resend = require('resend').Resend;
                const resend = new Resend(process.env.RESEND_API_KEY);

                await resend.emails.send({
                    from: 'Gather Receipts <receipts@gather.link>',
                    to: order.buyer_email,
                    subject: `Receipt for ${product?.title || 'Digital Product'}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Thank you for your purchase!</h1>
                            <p>Here is your receipt for <strong>${product?.title}</strong>.</p>
                            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Order ID:</strong> ${orderId}</p>
                                <p><strong>Amount:</strong> ${order.currency} ${order.amount}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                            <p>You can download your file or access your content using the link below:</p>
                            <a href="${downloadUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Content</a>
                            <p style="margin-top: 10px; font-size: 12px; color: #666;">This link expires in 7 days.</p>
                            <img src="${product?.image_url}" style="width: 100%; border-radius: 8px; margin-top: 20px; max-height: 200px; object-fit: cover;" />
                            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
                        </div>
                    `
                });
                console.log(`Receipt sent to ${order.buyer_email}`);
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
                // Don't fail the verification request just because email failed, but log it critical
            }
        }

        return res.status(200).json({ success: true, message: 'Purchase verified' });

    } catch (error: any) {
        console.error('Verify Purchase Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
