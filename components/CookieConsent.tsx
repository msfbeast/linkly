import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check localStorage
        const consented = localStorage.getItem('gather_cookie_consent');
        if (!consented) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('gather_cookie_consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4"
                >
                    <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
                        <div className="flex-1 text-sm text-slate-300 text-center sm:text-left">
                            <p>
                                We use cookies to enhance your experience and analyze usage. By using Gather, you agree to our{' '}
                                <a href="/privacy" className="text-white hover:underline underline-offset-2">Privacy Policy</a>
                                {' '}and{' '}
                                <a href="/terms" className="text-white hover:underline underline-offset-2">Terms of Service</a>.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAccept}
                                className="bg-white text-slate-900 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
