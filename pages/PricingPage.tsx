import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Crown, Globe, BarChart2, Shield, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PricingPage: React.FC = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const navigate = useNavigate();

    const tiers = [
        {
            name: 'Free',
            price: 0,
            description: 'Perfect for getting started',
            features: [
                '50 Links',
                'Basic Analytics',
                'Standard Support',
                'Gather Branding',
            ],
            notIncluded: [
                'Custom Domains',
                'Advanced Analytics',
                'API Access',
                'Team Members',
            ],
            cta: 'Current Plan',
            popular: false,
        },
        {
            name: 'Starter',
            price: isAnnual ? 9 : 12,
            description: 'For creators and small brands',
            features: [
                '500 Links',
                '1 Custom Domain',
                'Basic Analytics',
                'Remove Branding',
                'Priority Support',
            ],
            notIncluded: [
                'Advanced Analytics',
                'API Access',
                'Team Members',
            ],
            cta: 'Start Free Trial',
            popular: false,
        },
        {
            name: 'Pro',
            price: isAnnual ? 29 : 39,
            description: 'For power users and businesses',
            features: [
                'Unlimited Links',
                '5 Custom Domains',
                'Advanced Analytics',
                'API Access',
                'QR Codes',
                'UTM Builder',
            ],
            notIncluded: [
                'Team Members',
                'SSO',
            ],
            cta: 'Start Free Trial',
            popular: true,
        },
        {
            name: 'Premium',
            price: isAnnual ? 99 : 129,
            description: 'For agencies and large teams',
            features: [
                'Unlimited Everything',
                '20 Custom Domains',
                'Team Collaboration',
                'SSO / SAML',
                'Dedicated Success Manager',
                'SLA',
            ],
            notIncluded: [],
            cta: 'Contact Sales',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-8">
                        Choose the plan that's right for you. All paid plans include a 14-day free trial.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-stone-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-16 h-8 bg-slate-900 rounded-full p-1 transition-colors"
                        >
                            <motion.div
                                animate={{ x: isAnnual ? 32 : 0 }}
                                className="w-6 h-6 bg-white rounded-full shadow-sm"
                            />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-stone-500'}`}>
                            Annual <span className="text-green-600 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative bg-white rounded-3xl p-8 border ${tier.popular
                                ? 'border-amber-400 shadow-xl shadow-amber-500/10 scale-105 z-10'
                                : 'border-stone-200 shadow-sm hover:shadow-md'
                                } transition-all duration-300`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{tier.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-bold text-slate-900">${tier.price}</span>
                                    <span className="text-stone-500">/mo</span>
                                </div>
                                <p className="text-sm text-stone-500">{tier.description}</p>
                            </div>

                            <button
                                onClick={() => navigate('/signup')}
                                className={`w-full py-3 rounded-xl font-bold mb-8 transition-all ${tier.popular
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl'
                                    : 'bg-stone-100 text-slate-900 hover:bg-stone-200'
                                    }`}
                            >
                                {tier.cta}
                            </button>

                            <div className="space-y-4">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-slate-700">{feature}</span>
                                    </div>
                                ))}
                                {tier.notIncluded.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm opacity-50">
                                        <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <X className="w-3 h-3 text-stone-400" />
                                        </div>
                                        <span className="text-stone-500">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                        <div>
                            <h3 className="font-bold text-slate-900 mb-2">Can I cancel anytime?</h3>
                            <p className="text-stone-500">Yes, you can cancel your subscription at any time. You'll keep access to paid features until the end of your billing period.</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-2">What happens to my links if I downgrade?</h3>
                            <p className="text-stone-500">Your links will remain active, but you won't be able to edit them or view advanced analytics until you upgrade again.</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-2">Do you offer a free trial?</h3>
                            <p className="text-stone-500">Yes! All paid plans come with a 14-day free trial. No credit card required to start.</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-2">Can I use my own domain?</h3>
                            <p className="text-stone-500">Yes, custom domains are available on the Starter plan and above.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
