import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GatherMark from '../components/landing/GatherMark';
import { FREE_LINK_LIMIT } from '../utils/planLimits';
import { useAuth } from '../contexts/AuthContext';
import { Check } from 'lucide-react';
import { RAZORPAY_PLANS } from '../utils/razorpayPlans';

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

    const priceIds = RAZORPAY_PLANS;

    const handleSubscribe = async (priceId: string, tierName: string) => {
        if (!user) {
            navigate('/register');
            return;
        }

        setLoadingTier(tierName);

        try {
            // Razorpay Subscription Flow (Default)
            const { loadRazorpayScript, createRazorpaySubscription, authHeaders } = await import('../services/razorpayService');

            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                toast.error('Failed to load payment gateway');
                setLoadingTier(null);
                return;
            }

            // Create Subscription
            const subscription = await createRazorpaySubscription(priceId);

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
                                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                                body: JSON.stringify(response)
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

    // Only a signed-in user has a plan to mark.
    const tier = user ? (user.preferences?.subscription_tier || 'free') : null;
    const period = billingPeriod === 'monthly' ? 'month' : 'year';
    const plans: { id: 'free' | 'pro' | 'business'; name: string; blurb: string; features: string[]; dark?: boolean }[] = [
        {
            id: 'free', name: 'Free', blurb: 'Everything you need to start.',
            features: [
                `${FREE_LINK_LIMIT} short links`,
                'Click analytics: places, devices, sources, times (7 and 30 days)',
                'Store page and bio page at /@yourname',
                'Amazon and Flipkart tags added automatically',
                'QR codes, custom domains, password-protected and expiring links',
                'Developer API',
            ],
        },
        {
            id: 'pro', name: 'Pro', blurb: 'For creators who share a lot of links.', dark: true,
            features: ['Everything in Free', 'Unlimited short links', '90 days of analytics history'],
        },
        {
            id: 'business', name: 'Business', blurb: 'For teams that need a hand.',
            features: ['Everything in Pro', 'Priority email support'],
        },
    ];

    const action = (id: 'free' | 'pro' | 'business') => {
        if (id === tier) return { label: 'Your plan', disabled: true, onClick: () => {} };
        if (id === 'free') return { label: user ? 'Go to dashboard' : 'Sign up free', disabled: false, onClick: () => navigate(user ? '/dashboard' : '/register') };
        return { label: `Get ${id === 'pro' ? 'Pro' : 'Business'}`, disabled: loadingTier !== null, onClick: () => handleSubscribe(priceIds[currency][billingPeriod][id], id) };
    };

    return (
        <div className="min-h-screen bg-[#ECEBE7] text-[#18181A]">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
                <a href="/" className="flex items-center gap-2" aria-label="Gather home">
                    <GatherMark />
                    <span className="text-[17px] font-medium tracking-tight">Gather</span>
                </a>
                {user
                    ? <a href="/dashboard" className="rounded-full bg-[#18181A] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">Dashboard</a>
                    : <a href="/login" className="rounded-full px-4 py-2 text-[13px] text-[#5F5C56] hover:text-[#18181A]">Log in</a>}
            </nav>

            <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-8 sm:pt-14">
                <h1 className="text-[clamp(36px,6vw,64px)] font-medium leading-[1] tracking-[-0.035em]">Start free.<br />Pay when you need more.</h1>
                <p className="mt-4 max-w-xl text-[16px] text-[#5F5C56]">Prices in rupees. To change or cancel a paid plan, email support.</p>

                <div role="group" aria-label="Billing period" className="mt-8 inline-flex gap-1 rounded-full bg-[#FBFAF8] p-1">
                    {(['monthly', 'yearly'] as const).map(p => (
                        <button key={p} onClick={() => setBillingPeriod(p)} aria-pressed={billingPeriod === p}
                            className={`rounded-full px-4 py-2 text-[13px] transition-colors ${billingPeriod === p ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}>
                            {p === 'monthly' ? 'Monthly' : 'Yearly'}{p === 'yearly' && <span className={`ml-1.5 font-mono text-[11px] ${billingPeriod === p ? 'text-[#FF9B6A]' : 'text-[#FF5A14]'}`}>2 months free</span>}
                        </button>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
                    {plans.map(plan => {
                        const a = action(plan.id);
                        return (
                            <section key={plan.id} aria-label={`${plan.name} plan`}
                                className={`flex flex-col rounded-3xl p-6 sm:p-7 ${plan.dark ? 'bg-[#18181A] text-[#F2F1EE]' : 'bg-[#FBFAF8]'}`}>
                                <div className={`mb-4 flex items-center gap-2 text-[13px] ${plan.dark ? 'text-[#A19E97]' : 'text-[#8C8981]'}`}>
                                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]" />{plan.name}
                                    {plan.id === tier && <span className={`ml-auto rounded-full px-2.5 py-1 font-mono text-[11px] ${plan.dark ? 'bg-[#2A2A2D]' : 'bg-[#F0EEEA]'}`}>your plan</span>}
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="font-mono text-[48px] font-medium leading-none tracking-[-0.04em]">{prices[currency][billingPeriod][plan.id]}</span>
                                    {plan.id !== 'free' && <span className={`font-mono text-[13px] ${plan.dark ? 'text-[#8E8B84]' : 'text-[#8C8981]'}`}>/ {period}</span>}
                                </div>
                                <p className={`mt-3 text-[14px] ${plan.dark ? 'text-[#A19E97]' : 'text-[#5F5C56]'}`}>{plan.blurb}</p>
                                <ul className="mb-8 mt-5 grid gap-2.5 text-[14px]">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex gap-2.5">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5A14]" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={a.onClick} disabled={a.disabled}
                                    className={`mt-auto w-full rounded-full py-3 text-[14px] font-medium transition-opacity disabled:cursor-default disabled:opacity-50 ${plan.dark ? 'bg-[#FF5A14] text-white hover:opacity-90' : 'bg-[#18181A] text-white hover:opacity-90'}`}>
                                    {loadingTier === plan.id ? 'Opening checkout…' : a.label}
                                </button>
                            </section>
                        );
                    })}
                </div>

                <p className="mt-6 text-[13px] text-[#8C8981]">
                    Questions about plans or invoices? Email <a href="mailto:support@gather.link" className="underline underline-offset-2 hover:text-[#18181A]">support@gather.link</a>.
                </p>
            </main>
        </div>
    );
};

export default Pricing;
