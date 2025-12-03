import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Smartphone, Download } from 'lucide-react';
import { AppRecommendation } from '../../types';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';

interface AppStackBlockProps {
    userId?: string;
    items?: AppRecommendation[];
    title?: string;
}

export const AppStackBlock: React.FC<AppStackBlockProps> = ({
    userId,
    items: propItems,
    title = "What's On My Phone"
}) => {
    const [apps, setApps] = useState<AppRecommendation[]>([]);
    const [selectedApp, setSelectedApp] = useState<AppRecommendation | null>(null);

    useEffect(() => {
        if (propItems) {
            setApps(propItems);
        } else if (userId) {
            const fetchApps = async () => {
                try {
                    const data = await supabaseAdapter.getApps(userId);
                    setApps(data);
                } catch (error) {
                    console.error('Error fetching apps:', error);
                }
            };
            fetchApps();
        }
    }, [userId, propItems]);

    if (!apps || apps.length === 0) return null;

    return (
        <div className="w-full my-8">
            <h3 className="text-center font-black text-xl mb-6 uppercase tracking-tight flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5" />
                {title}
            </h3>

            <div className="grid grid-cols-4 gap-4 px-2">
                {apps.map((app) => (
                    <motion.button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="flex flex-col items-center gap-2 group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] bg-white shadow-sm border border-stone-100 overflow-hidden relative">
                            {app.iconUrl ? (
                                <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                            )}
                            {app.isPaid && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                    $
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight line-clamp-2 w-full px-1">
                            {app.name}
                        </span>
                    </motion.button>
                ))}
            </div>

            {/* App Details Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedApp(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="absolute top-4 right-4 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[24px] bg-stone-100 overflow-hidden shadow-lg mb-6">
                                    {selectedApp.iconUrl ? (
                                        <img src={selectedApp.iconUrl} alt={selectedApp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                                            <Smartphone className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedApp.name}</h3>
                                <p className="text-stone-500 text-sm font-medium mb-6">
                                    {selectedApp.developer} • {selectedApp.category}
                                </p>

                                {selectedApp.description && (
                                    <div className="bg-stone-50 rounded-xl p-4 w-full mb-6 text-left">
                                        <p className="text-stone-600 text-sm leading-relaxed">
                                            {selectedApp.description}
                                        </p>
                                    </div>
                                )}

                                {selectedApp.linkUrl && (
                                    <a
                                        href={selectedApp.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        <Download className="w-5 h-5" />
                                        {selectedApp.isPaid ? 'Buy App' : 'Get App'}
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
