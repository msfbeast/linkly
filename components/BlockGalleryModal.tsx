import React from 'react';
import {
    X, Link as LinkIcon, Music, MapPin, Video,
    BarChart2, Mail, Plus, QrCode as QrCodeIcon, Lock
} from 'lucide-react';

export type BlockType = 'link' | 'map' | 'newsletter' | 'tip_jar' | 'qr_code';

interface BlockGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: BlockType) => void;
    subscriptionTier?: 'free' | 'pro' | 'business';
}

interface BlockOption {
    type: BlockType;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: 'essentials' | 'media' | 'engagement' | 'growth';
    isNew?: boolean;
    isPremium?: boolean;
}

const BLOCKS: BlockOption[] = [
    // Essentials
    {
        type: 'link',
        title: 'Link',
        description: 'Simple URL link to any website',
        icon: <LinkIcon className="w-5 h-5" />,
        category: 'essentials'
    },
    {
        type: 'qr_code',
        title: 'QR Code',
        description: 'Scannable QR code for your profile',
        icon: <QrCodeIcon className="w-5 h-5" />,
        category: 'essentials',
        isNew: true
    },
    // Media
    {
        type: 'map',
        title: 'Location Map',
        description: 'Show a specific location on a map',
        icon: <MapPin className="w-5 h-5" />,
        category: 'media',
        isPremium: true
    },
    // Growth
    {
        type: 'newsletter',
        title: 'Newsletter',
        description: 'Collect emails from visitors',
        icon: <Mail className="w-5 h-5" />,
        category: 'growth'
    },
    // Monetization
    {
        type: 'tip_jar',
        title: 'Tip Jar',
        description: 'Accept support from fans',
        icon: <BarChart2 className="w-5 h-5" />,
        category: 'growth',
        isPremium: true
    }
];

export const BlockGalleryModal: React.FC<BlockGalleryModalProps> = ({ isOpen, onClose, onSelect, subscriptionTier = 'free' }) => {
    if (!isOpen) return null;

    const isPremiumTier = ['pro', 'business'].includes(subscriptionTier);

    const renderCategory = (title: string, category: string) => {
        const items = BLOCKS.filter(b => b.category === category);
        if (items.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((block) => {
                        const isLocked = block.isPremium && !isPremiumTier;

                        return (
                            <button
                                key={block.type}
                                onClick={() => !isLocked && onSelect(block.type)}
                                className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left group relative bg-white ${isLocked
                                    ? 'border-stone-100 opacity-60 cursor-not-allowed'
                                    : 'border-stone-200 hover:border-indigo-500 hover:bg-stone-50'
                                    }`}
                            >
                                <div className={`p-3 rounded-lg transition-colors ${isLocked
                                    ? 'bg-stone-50 text-stone-400'
                                    : 'bg-stone-100 text-stone-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                    }`}>
                                    {block.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`block font-bold text-sm transition-colors ${isLocked ? 'text-stone-400' : 'text-slate-900 group-hover:text-indigo-700'
                                            }`}>
                                            {block.title}
                                        </span>
                                        {isLocked && <Lock className="w-3 h-3 text-stone-400" />}
                                    </div>
                                    <span className="block text-xs text-stone-500 leading-relaxed">
                                        {block.description}
                                    </span>
                                </div>
                                {block.isNew && !isLocked && (
                                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                                        New
                                    </span>
                                )}
                                {block.isPremium && (
                                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isLocked ? 'bg-stone-100 text-stone-400' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {isLocked ? 'Pro' : 'Paid'}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-scaleIn flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-500" />
                            Add Content
                        </h2>
                        <p className="text-sm text-stone-500">Choose a block to add to your bio page</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-400 hover:text-stone-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-stone-50/50">
                    {renderCategory("Essentials", "essentials")}
                    {renderCategory("Media", "media")}
                    {renderCategory("Engagement", "engagement")}
                    {renderCategory("Growth", "growth")}
                </div>
            </div>
        </div>
    );
};

