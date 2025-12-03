import React, { useState } from 'react';
import { Mail, Check, Loader2, ArrowRight } from 'lucide-react';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsletterBlockProps {
    userId: string;
    title?: string;
    description?: string;
    buttonText?: string;
}

export const NewsletterBlock: React.FC<NewsletterBlockProps> = ({
    userId,
    title = "Join the Newsletter",
    description = "Get the latest updates directly to your inbox.",
    buttonText = "Subscribe"
}) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        setStatus('loading');
        try {
            await supabaseAdapter.addSubscriber(userId, email);
            setStatus('success');
            setEmail('');
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-stone-100 my-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <Mail className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-stone-500">{description}</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {status === 'success' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 mt-4"
                    >
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Thanks for subscribing!</span>
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="mt-4 flex gap-2"
                    >
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {status === 'loading' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="hidden sm:inline">{buttonText}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
            {status === 'error' && (
                <p className="text-red-500 text-xs mt-2 ml-1">Something went wrong. Please try again.</p>
            )}
        </div>
    );
};
