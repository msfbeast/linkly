import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from './_lib/supabaseServer';

const DOWNLOAD_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function signedDownloadUrl(supabase: SupabaseClient, fileUrl: string | null): Promise<string | undefined> {
    if (!fileUrl) return undefined;
    if (fileUrl.startsWith('http')) return fileUrl;
    const { data, error } = await supabase.storage
        .from('digital-products')
        .createSignedUrl(fileUrl, DOWNLOAD_TTL_SECONDS);
    if (error || !data) {
        console.warn('[Verify] Failed to sign URL:', error);
        return undefined;
    }
    return data.signedUrl;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabase = getAdminClient();
    if (!keySecret || !supabase) {
        console.error('[Verify] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Verify Razorpay signature over order_id|payment_id
        const expected = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (!safeEqual(expected, String(razorpay_signature))) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // 2. The paid Razorpay order must be the one we created for this
        //    internal order. The product is taken from the order row, so a
        //    payment for one product can't unlock another.
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, product_id, status, razorpay_order_id, razorpay_payment_id, customer_email, amount, currency')
            .eq('id', orderId)
            .maybeSingle();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.razorpay_order_id !== razorpay_order_id) {
            return res.status(400).json({ error: 'Payment does not match order' });
        }

        // 3. Mark paid exactly once (conditional update guards against
        //    replays and concurrent verifications).
        let firstVerification = false;
        if (order.status === 'paid') {
            if (order.razorpay_payment_id !== razorpay_payment_id) {
                return res.status(409).json({ error: 'Order already paid' });
            }
        } else {
            const { data: updated, error: updateError } = await supabase
                .from('orders')
                .update({ status: 'paid', razorpay_payment_id })
                .eq('id', order.id)
                .eq('status', 'pending')
                .select('id');

            if (updateError) {
                console.error('Order update error:', updateError);
                return res.status(500).json({ error: 'Failed to update order status' });
            }
            if (!updated || updated.length === 0) {
                return res.status(409).json({ error: 'Order is not pending' });
            }
            firstVerification = true;
        }

        const { data: product } = order.product_id
            ? await supabase
                .from('products')
                .select('id, name, file_url, sales_count')
                .eq('id', order.product_id)
                .maybeSingle()
            : { data: null };

        const downloadUrl = await signedDownloadUrl(supabase, product?.file_url ?? null);

        if (firstVerification) {
            if (product) {
                await supabase
                    .from('products')
                    .update({ sales_count: (product.sales_count || 0) + 1 })
                    .eq('id', product.id);
            }

            // 4. Receipt email (best-effort)
            if (order.customer_email && process.env.RESEND_API_KEY) {
                try {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const fromEmail = process.env.RESEND_FROM_EMAIL || 'receipts@gather.link';
                    const title = escapeHtml(product?.name || 'Digital Product');
                    await resend.emails.send({
                        from: `Gather Receipts <${fromEmail}>`,
                        to: order.customer_email,
                        subject: `Receipt for ${product?.name || 'Digital Product'}`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1>Thank you for your purchase!</h1>
                                <p>Here is your receipt for <strong>${title}</strong>.</p>
                                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
                                    <p><strong>Amount:</strong> ${escapeHtml(order.currency)} ${escapeHtml(order.amount)}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                </div>
                                ${downloadUrl ? `
                                <p>You can download your file or access your content using the link below:</p>
                                <a href="${escapeHtml(downloadUrl)}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Content</a>
                                <p style="margin-top: 10px; font-size: 12px; color: #666;">This link expires in 7 days.</p>` : ''}
                                <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have any questions, please reply to this email.</p>
                            </div>
                        `,
                    });
                } catch (emailError) {
                    console.error('Failed to send receipt email:', emailError);
                }
            }
        }

        return res.status(200).json({ success: true, message: 'Purchase verified', downloadUrl });
    } catch (error: any) {
        console.error('Verify Purchase Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
