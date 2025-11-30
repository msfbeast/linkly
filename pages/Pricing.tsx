import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PricingCard from '../components/PricingCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    const handleSubscribe = async (priceId: string, tierName: string) => {
        if (!user) {
            navigate('/register');
            return;
        }

        setLoadingTier(tierName);

        try {
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
                alert('Failed to start checkout. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        } finally {
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
                    <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                        Start free, upgrade as you grow. No hidden fees. Cancel anytime.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
                    <PricingCard
                        title="Free"
                        price="$0"
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
                        price="$12"
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
                        onSelect={() => handleSubscribe('price_1Q...', 'pro')} // Replace with real Price ID
                    />

                    <PricingCard
                        title="Business"
                        price="$49"
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
                        onSelect={() => handleSubscribe('price_1Q...', 'business')} // Replace with real Price ID
                    />
                </div>
            </div>
        </div>
    );
};

export default Pricing;
