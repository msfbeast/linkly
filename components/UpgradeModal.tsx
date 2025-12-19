import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, BarChart2, Globe, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trigger: 'limit_reached' | 'custom_domain' | 'analytics' | 'general';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, trigger }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const content = {
        limit_reached: {
            icon: Zap,
            title: "You've reached your link limit",
            description: "You've created 50 links on the Free plan. Upgrade to Pro for unlimited links and more.",
            feature: "Unlimited Links",
        },
        custom_domain: {
            icon: Globe,
            title: "Connect your own domain",
            description: "Custom domains are available on the Starter plan and above. Build your brand with a custom URL.",
            feature: "Custom Domains",
        },
        analytics: {
            icon: BarChart2,
            title: "Unlock detailed analytics",
            description: "Get deep insights into your audience with advanced analytics, location data, and device tracking.",
            feature: "Advanced Analytics",
        },
        general: {
            icon: Crown,
            title: "Upgrade your experience",
            description: "Unlock the full potential of Gather with Pro features.",
            feature: "Pro Features",
        },
    }[trigger];

    const Icon = content.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                >
                    {/* Header Background */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-slate-900 to-slate-800" />

                    <div className="relative p-8 pt-12">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6">
                                <Icon className="w-10 h-10 text-amber-500" />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{content.title}</h2>
                            <p className="text-stone-500">{content.description}</p>
                        </div>

                        <div className="bg-stone-50 rounded-2xl p-6 mb-8 border border-stone-100">
                            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Pro Plan Includes</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="font-medium">Unlimited Links</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="font-medium">Custom Domains</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-green-600" />
                                    </div>
                                    <span className="font-medium">Advanced Analytics</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/pricing');
                                }}
                                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
                            >
                                View Plans & Pricing
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-stone-400 hover:text-slate-600 font-medium transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
