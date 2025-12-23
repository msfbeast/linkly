import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PricingCard from '../components/PricingCard';
import { useAuth } from '../contexts/AuthContext';
// import { createOrder, startPayment } from '../services/cashfreeService'; // Removed
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
    const currency = 'INR';
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const prices = {
        INR: {
            monthly: { free: '₹0', pro: '₹399', business: '₹2,499' },
            yearly: { free: '₹0', pro: '₹3,999', business: '₹24,999' }
        }
    };

    // Placeholder IDs - To be filled by User
    const priceIds = {
        INR: {
            monthly: { pro: 'plan_RuwgZWy5U7TtRf', business: 'plan_RuwhIlSY4xmePl' },
            yearly: { pro: 'plan_Ruwh4kaj1GtTia', business: 'plan_RuwhesYYL42H6Q' }
        }
    };

    const handleSubscribe = async (priceId: string, tierName: string) => {
        if (!user) {
            navigate('/register');
            return;
        }

        setLoadingTier(tierName);

        try {
            // Razorpay Subscription Flow (Default)
            const { loadRazorpayScript, createRazorpaySubscription, verifyRazorpayPayment } = await import('../services/razorpayService');

            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                toast.error('Failed to load payment gateway');
                setLoadingTier(null);
                return;
            }

            // Create Subscription
            const subscription = await createRazorpaySubscription(priceId, {
                userId: user.id,
                tier: tierName
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                subscription_id: subscription.id,
                name: "Gather",
                description: `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} Subscription (${billingPeriod})`,
                handler: async function (response: any) {
                    try {
                        // Check if it's a subscription response (has razorpay_subscription_id)
                        if (response.razorpay_subscription_id) {
                            toast.loading('Verifying subscription...');
                            // Call specialized verify endpoint
                            const verifyResponse = await fetch('/api/verify-razorpay-subscription', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...response,
                                    userId: user.id,
                                    tier: tierName
                                })
                            });

                            if (!verifyResponse.ok) throw new Error('Verification failed');

                            toast.dismiss();
                            toast.success('Subscription activated!');
                            window.location.href = '/dashboard';
                        } else {
                            // Fallback or Error
                            throw new Error('Invalid response from payment gateway');
                        }
                    } catch (err) {
                        toast.dismiss();
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.user_metadata?.full_name,
                    email: user.email,
                    contact: (user as any).phone
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(response.error.description || 'Payment failed');
            });
            rzp.open();
            setLoadingTier(null);

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

                </div>

                {/* Toggles Container */}
                <div className="flex flex-col items-center gap-6 mb-16">
                    {/* Billing Period Toggle */}
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${billingPeriod === 'yearly' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-bold ${billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                            Yearly <span className="text-emerald-500 text-xs ml-1">(2 Months Free)</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    <PricingCard
                        title="Free"
                        price={prices[currency][billingPeriod].free}
                        period={billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        description="For hobbyists and beginners"
                        features={[
                            "15 Active Links",
                            "Basic Analytics (7-day History)",
                            "Gather Branding",
                            "Basic QR Codes (B&W)",
                            "No Team Collaboration"
                        ]}
                        buttonText={user ? "Current Plan" : "Sign Up Free"}
                        onSelect={() => user ? navigate('/dashboard') : navigate('/register')}
                    />

                    <PricingCard
                        title="Pro"
                        price={prices[currency][billingPeriod].pro}
                        period={billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        description="For creators and professionals"
                        isPopular={true}
                        isLoading={loadingTier === 'pro'}
                        features={[
                            "Unlimited Active Links",
                            "Digital Storefront (Sell Products)",
                            "0% Transaction Fees",
                            "90-Day Analytics History",
                            "Custom Bio Themes & CSS",
                            "No Gather Branding",
                            "Custom QR Codes",
                            "Password Protection",
                            "5 Team Members"
                        ]}
                        buttonText={user?.preferences?.subscription_tier === 'pro' ? "Current Plan" : "Upgrade to Pro"}
                        onSelect={() => handleSubscribe(priceIds[currency][billingPeriod].pro, 'pro')}
                    />

                    <PricingCard
                        title="Business"
                        price={prices[currency][billingPeriod].business}
                        period={billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        description="For agencies and large teams"
                        isLoading={loadingTier === 'business'}
                        features={[
                            "Everything in Pro",
                            "1-Year Data Retention",
                            "Custom Domains (White-label)",
                            "Export Data (CSV/API)",
                            "Unlimited Team Members",
                            "Priority Support",
                            "SSO / SAML (Coming Soon)"
                        ]}
                        buttonText={user?.preferences?.subscription_tier === 'business' ? "Current Plan" : "Upgrade to Business"}
                        onSelect={() => handleSubscribe(priceIds[currency][billingPeriod].business, 'business')}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;
