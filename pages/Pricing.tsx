import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PricingCard from '../components/PricingCard';
import { useAuth } from '../contexts/AuthContext';
import { createOrder, startPayment } from '../services/cashfreeService';
import { Check, Zap, Shield, BarChart3, Globe, Users } from 'lucide-react';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

    useEffect(() => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone === 'Asia/Kolkata') {
            setCurrency('INR');
        }
    }, []);

    const prices = {
        USD: { free: '$0', pro: '$12', business: '$49' },
        INR: { free: '₹0', pro: '₹999', business: '₹3,999' }
    };

    const priceIds = {
        USD: { pro: 'price_pro_usd_test', business: 'price_business_usd_test' },
        INR: { pro: 'price_pro_inr_test', business: 'price_business_inr_test' }
    };

    const handleSubscribe = async (priceId: string, tierName: string) => {
        if (!user) {
            navigate('/register');
            return;
        }

        setLoadingTier(tierName);

        try {
            if (currency === 'INR') {
                // Cashfree Flow
                const amount = tierName === 'pro' ? 999 : 3999; // Amount in INR (not paisa for Cashfree)

                const order = await createOrder({
                    amount,
                    customerId: user.id,
                    customerName: user.user_metadata?.full_name || user.email || 'User',
                    customerPhone: (user as any).phone || '9999999999'
                });

                await startPayment(order.payment_session_id);

                // Payment success is handled via return_url in api/create-cashfree-order.ts
                // But we can also handle it here if using 'seamless' mode later
                toast.dismiss(); // Dismiss any loading toasts
                setLoadingTier(null);

            } else {
                // Stripe Flow (Existing)
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        priceId,
                        userId: user.id,
                        email: user.email,
                        returnUrl: window.location.origin + '/dashboard',
                    }),
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    console.error('Failed to create checkout session:', data.error);
                    toast.error('Failed to start checkout. Please try again.');
                    setLoadingTier(null);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred. Please try again.');
            setLoadingTier(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Pricing</h2>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Plans for every stage of growth
                    </p>
                    <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 mb-8">
                        Start free, upgrade as you grow. No hidden fees. Cancel anytime.
                    </p>

                    {/* Currency Toggle */}
                    <div className="flex justify-center items-center gap-4">
                        <span className={`text-sm font-bold ${currency === 'USD' ? 'text-slate-900' : 'text-slate-400'}`}>USD</span>
                        <button
                            onClick={() => setCurrency(prev => prev === 'USD' ? 'INR' : 'USD')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${currency === 'INR' ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${currency === 'INR' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-bold ${currency === 'INR' ? 'text-slate-900' : 'text-slate-400'}`}>INR (UPI)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    <PricingCard
                        title="Free"
                        price={prices[currency].free}
                        period="mo"
                        description="Perfect for getting started"
                        features={[
                            "50 Links",
                            "Basic Analytics",
                            "Standard Support",
                            "1 Team Member"
                        ]}
                        buttonText={user ? "Current Plan" : "Sign Up Free"}
                        onSelect={() => user ? navigate('/dashboard') : navigate('/register')}
                    />

                    <PricingCard
                        title="Pro"
                        price={prices[currency].pro}
                        period="mo"
                        description="For creators and professionals"
                        isPopular={true}
                        isLoading={loadingTier === 'pro'}
                        features={[
                            "Unlimited Links",
                            "Advanced Analytics",
                            "Custom Domains",
                            "Priority Support",
                            "5 Team Members",
                            "Remove Branding"
                        ]}
                        buttonText={user?.preferences?.subscription_tier === 'pro' ? "Current Plan" : "Upgrade to Pro"}
                        onSelect={() => handleSubscribe(priceIds[currency].pro, 'pro')}
                    />

                    <PricingCard
                        title="Business"
                        price={prices[currency].business}
                        period="mo"
                        description="For agencies and large teams"
                        isLoading={loadingTier === 'business'}
                        features={[
                            "Everything in Pro",
                            "Unlimited Team Members",
                            "SSO / SAML",
                            "Dedicated Account Manager",
                            "API Access",
                            "Audit Logs"
                        ]}
                        buttonText={user?.preferences?.subscription_tier === 'business' ? "Current Plan" : "Upgrade to Business"}
                        onSelect={() => handleSubscribe(priceIds[currency].business, 'business')}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;
