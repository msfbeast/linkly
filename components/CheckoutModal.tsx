import React, { useState } from 'react';
import { X, ShieldCheck, Download, Loader2, CreditCard } from 'lucide-react';
import { Product } from '@/types';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment } from '@/services/razorpayService';
import { toast } from 'sonner';

interface CheckoutModalProps {
    product: Product;
    onClose: () => void;
    storeName: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, onClose, storeName }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
    const [customerEmail, setCustomerEmail] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');

    const handlePayment = async () => {
        if (!customerEmail) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            // 1. Load Razorpay Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                toast.error('Failed to load payment gateway');
                setLoading(false);
                return;
            }

            // 2. Create Order
            const order = await createRazorpayOrder(product.price, product.currency || 'INR');

            // 3. Open Razorpay Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: storeName,
                description: `Purchase: ${product.name}`,
                image: product.imageUrl,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            customer_email: customerEmail,
                            product_id: product.id
                        };

                        // 4. Verify Payment
                        const result = await verifyRazorpayPayment(verifyData);

                        if (result.success) {
                            setStep('success');
                            // Use signed URL logic if available, for now basic path
                            const signedUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/digital-products/${product.fileUrl}`;
                            setDownloadUrl(signedUrl);
                            toast.success('Payment successful!');
                        } else {
                            toast.error('Payment verification failed');
                        }
                    } catch (err) {
                        toast.error('Payment verification failed');
                        console.error(err);
                    }
                },
                prefill: {
                    email: customerEmail,
                },
                theme: {
                    color: '#10b981', // Emerald-500
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            console.error('Payment initialization error:', error);
            toast.error(error.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{storeName}</h3>
                        <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Secure Checkout</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {step === 'details' && (
                    <div className="p-6">
                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-20 bg-stone-100 rounded-xl shrink-0 overflow-hidden border border-stone-200">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 mb-1 line-clamp-2">{product.name}</h2>
                                <p className="text-stone-500 text-sm mb-2">{product.category || 'Digital Product'}</p>
                                <div className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                                />
                                <p className="text-[10px] text-stone-400 mt-1">We'll send the download link to this email.</p>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading || !customerEmail}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                Pay {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                        <p className="text-stone-500 mb-8 max-w-xs mx-auto">
                            Thank you for your purchase. Your file is ready for download.
                        </p>

                        <a
                            href={downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download File
                        </a>

                        <button
                            onClick={onClose}
                            className="mt-4 text-stone-400 hover:text-stone-600 text-sm font-bold"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Footer Trust */}
                <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-center gap-4 text-stone-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Powered by Gather Secure</span>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
