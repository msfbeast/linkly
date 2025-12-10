import React from 'react';
import {
    X, Link as LinkIcon, Music, MapPin, Video,
    BarChart2, MessageCircle, Mail, Plus, MonitorSmartphone
} from 'lucide-react';

export type BlockType = 'link' | 'music' | 'map' | 'video' | 'poll' | 'qna' | 'newsletter' | 'social_feed' | 'tip_jar';

interface BlockGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: BlockType) => void;
}

interface BlockOption {
    type: BlockType;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: 'essentials' | 'media' | 'engagement' | 'growth';
    isNew?: boolean;
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
    // Media
    {
        type: 'music',
        title: 'Music Player',
        description: 'Embed Spotify, Apple Music, or SoundCloud',
        icon: <Music className="w-5 h-5" />,
        category: 'media'
    },
    {
        type: 'video',
        title: 'Video',
        description: 'Embed YouTube or Vimeo videos',
        icon: <Video className="w-5 h-5" />,
        category: 'media'
    },
    {
        type: 'map',
        title: 'Location Map',
        description: 'Show a specific location on a map',
        icon: <MapPin className="w-5 h-5" />,
        category: 'media'
    },
    // Engagement
    {
        type: 'poll',
        title: 'Poll',
        description: 'Ask your audience a question',
        icon: <BarChart2 className="w-5 h-5" />,
        category: 'engagement',
        isNew: true
    },
    {
        type: 'qna',
        title: 'Q&A',
        description: 'Let visitors ask you anything',
        icon: <MessageCircle className="w-5 h-5" />,
        category: 'engagement',
        isNew: true
    },
    {
        type: 'social_feed',
        title: 'Social Feed',
        description: 'Embed latest posts (Coming Soon)',
        icon: <MonitorSmartphone className="w-5 h-5" />,
        category: 'engagement'
    },
    // Growth
    {
        type: 'newsletter',
        title: 'Newsletter',
        description: 'Collect emails from visitors',
        icon: <Mail className="w-5 h-5" />,
        category: 'growth'
    }
];

export const BlockGalleryModal: React.FC<BlockGalleryModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const renderCategory = (title: string, category: string) => {
        const items = BLOCKS.filter(b => b.category === category);
        if (items.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((block) => (
                        <button
                            key={block.type}
                            onClick={() => onSelect(block.type)}
                            className="flex items-start gap-4 p-4 rounded-xl border border-stone-200 hover:border-indigo-500 hover:bg-stone-50 transition-all text-left group relative bg-white"
                        >
                            <div className="p-3 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                {block.icon}
                            </div>
                            <div className="flex-1">
                                <span className="block font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm mb-1">
                                    {block.title}
                                </span>
                                <span className="block text-xs text-stone-500 leading-relaxed">
                                    {block.description}
                                </span>
                            </div>
                            {block.isNew && (
                                <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                                    New
                                </span>
                            )}
                        </button>
                    ))}
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
