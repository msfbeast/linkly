import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-24 md:max-w-md"
                >
                    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl bg-slate-900/90">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg shrink-0">
                                <Download className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm truncate">Install Gather</h3>
                                <p className="text-xs text-stone-400 truncate">Add to home screen for quick access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={handleDismiss}
                                className="p-2 text-stone-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-yellow-400/20 active:scale-95 transition-transform whitespace-nowrap"
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
