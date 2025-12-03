import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // setShowPrompt(true); - Removed, deferredPrompt presence controls visibility
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
        // No need to set showPrompt, clearing deferredPrompt will hide it
    };

    if (!deferredPrompt) return null;

    return (
        <AnimatePresence mode="wait">
            {isMinimized ? (
                <motion.button
                    key="minimized"
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    onClick={() => setIsMinimized(false)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors group"
                >
                    <Download className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold">Install App</span>
                </motion.button>
            ) : (
                <motion.div
                    key="expanded"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 max-w-sm cursor-default"
                >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                        <img src="/pwa-icon.png" alt="Gather" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">Install Gather</h3>
                        <p className="text-xs text-slate-400">Add to home screen for quick access</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                        >
                            Install
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMinimized(true);
                            }}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Minimize"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPrompt;
