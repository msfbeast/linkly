import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Camera, Headphones, Laptop, Plug, Package, ShoppingBag } from 'lucide-react';
import { TechVaultItem, TechVaultCategory, WidgetVariant } from '../../types';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';

interface TechVaultBlockProps {
    userId?: string;
    items?: TechVaultItem[];
    title?: string;
    variant?: WidgetVariant;
    className?: string;
}

const getCategoryIcon = (category?: TechVaultCategory) => {
    switch (category) {
        case 'camera': return Camera;
        case 'audio': return Headphones;
        case 'computer': return Laptop;
        case 'accessories': return Plug;
        default: return Package;
    }
};

const getCategoryColor = (category?: TechVaultCategory) => {
    switch (category) {
        case 'camera': return 'bg-purple-500';
        case 'audio': return 'bg-orange-500';
        case 'computer': return 'bg-blue-500';
        case 'accessories': return 'bg-green-500';
        default: return 'bg-stone-500';
    }
};

export const TechVaultBlock: React.FC<TechVaultBlockProps> = ({
    userId,
    items: propItems,
    title = "My Tech Vault",
    variant = 'default',
    className = ''
}) => {
    const [items, setItems] = useState<TechVaultItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<TechVaultItem | null>(null);

    useEffect(() => {
        if (propItems) {
            setItems(propItems);
        } else if (userId) {
            const fetchItems = async () => {
                try {
                    const data = await supabaseAdapter.getTechVaultItems(userId);
                    setItems(data);
                } catch (error) {
                    console.error('Error fetching tech vault items:', error);
                }
            };
            fetchItems();
        }
    }, [userId, propItems]);

    // Auto-hide when empty
    if (!items || items.length === 0) return null;

    const getContainerStyles = () => {
        switch (variant) {
            case 'neubrutalism':
                return 'border-4 border-black bg-white';
            case 'bauhaus':
                return 'border-4 border-black bg-white';
            case 'retro':
                return 'border-2 border-stone-800 bg-[#f4ebd0]';
            case 'archive':
                return 'border border-stone-600 bg-[#f4f4f0]';
            case 'industrial':
                return 'border-2 border-slate-600 bg-slate-100';
            case 'cyberpunk':
                return 'border border-cyan-500 bg-black text-cyan-500';
            case 'glass':
                return 'border border-white/20 bg-white/10 backdrop-blur-md text-white';
            case 'clay':
                return 'bg-[#E0E5EC] text-[#4A5568]';
            case 'lofi':
                return 'border border-stone-300 bg-stone-50';
            case 'lab':
                return 'border border-blue-200 bg-white';
            default:
                return 'bg-white border border-stone-200';
        }
    };

    const getCardStyles = () => {
        switch (variant) {
            case 'neubrutalism':
                return 'border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]';
            case 'bauhaus':
                return 'border-2 border-black bg-white';
            case 'retro':
                return 'border-2 border-stone-800 bg-[#fdf8e8]';
            case 'cyberpunk':
                return 'border border-cyan-500/50 bg-black/80 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]';
            case 'glass':
                return 'border border-white/20 bg-white/10 backdrop-blur';
            case 'clay':
                return 'bg-[#E0E5EC] shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]';
            default:
                return 'border border-stone-200 bg-white hover:shadow-md';
        }
    };

    const getTitleStyles = () => {
        switch (variant) {
            case 'cyberpunk':
                return 'text-cyan-400';
            case 'glass':
                return 'text-white';
            default:
                return 'text-slate-900';
        }
    };

    return (
        <div className={`w-full my-8 ${className}`}>
            <h3 className={`text-center font-black text-xl mb-6 uppercase tracking-tight flex items-center justify-center gap-2 ${getTitleStyles()}`}>
                <Package className="w-5 h-5" />
                {title}
            </h3>

            <div className={`rounded-2xl p-4 ${getContainerStyles()}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const Icon = getCategoryIcon(item.category);
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className={`flex flex-col items-center p-4 rounded-xl transition-all ${getCardStyles()}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-3 relative">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${getCategoryColor(item.category)}`}>
                                            <Icon className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-bold text-center line-clamp-2 ${variant === 'cyberpunk' ? 'text-cyan-400' : ''}`}>
                                    {item.name}
                                </span>
                                {item.brand && (
                                    <span className={`text-[10px] mt-1 ${variant === 'cyberpunk' ? 'text-cyan-600' : 'text-stone-400'}`}>
                                        {item.brand}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Item Details Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-4 right-4 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Image */}
                            {selectedItem.imageUrl && (
                                <div className="w-full aspect-square bg-stone-100">
                                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-contain" />
                                </div>
                            )}

                            <div className="p-6 text-center">
                                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white mb-3 ${getCategoryColor(selectedItem.category)}`}>
                                    {React.createElement(getCategoryIcon(selectedItem.category), { className: "w-3 h-3" })}
                                    {selectedItem.category || 'Other'}
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedItem.name}</h3>
                                {selectedItem.brand && (
                                    <p className="text-stone-500 text-sm font-medium mb-4">{selectedItem.brand}</p>
                                )}

                                {selectedItem.description && (
                                    <div className="bg-stone-50 rounded-xl p-4 w-full mb-4 text-left">
                                        <p className="text-stone-600 text-sm leading-relaxed">
                                            {selectedItem.description}
                                        </p>
                                    </div>
                                )}

                                {selectedItem.affiliateUrl && (
                                    <a
                                        href={selectedItem.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-black hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        View Product
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
