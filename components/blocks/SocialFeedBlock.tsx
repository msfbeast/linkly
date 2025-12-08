
import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, Linkedin, Loader2 } from 'lucide-react';

import { WidgetVariant } from '../../types';

interface SocialFeedBlockProps {
    platform?: 'instagram' | 'twitter' | 'linkedin';
    username?: string;
    variant?: WidgetVariant;
    className?: string;
}

export const SocialFeedBlock: React.FC<SocialFeedBlockProps> = ({ platform = 'twitter', username, variant = 'default', className = '' }) => {
    const [loading, setLoading] = useState(true);

    // Simulate feed loading
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const getIcon = () => {
        switch (platform) {
            case 'instagram': return <Instagram className="w-5 h-5" />;
            case 'linkedin': return <Linkedin className="w-5 h-5" />;
            case 'twitter':
            default: return <Twitter className="w-5 h-5" />;
        }
    };

    const getHeaderColor = () => {
        switch (platform) {
            case 'instagram': return 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500';
            case 'linkedin': return 'bg-[#0077b5]';
            case 'twitter':
            default: return 'bg-black';
        }
    };

    const getContainerStyles = () => {
        switch (variant) {
            case 'neubrutalism':
                return 'rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
            case 'bauhaus':
                return 'rounded-none border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
            case 'retro':
                return 'rounded-sm border-2 border-stone-800 bg-[#f4ebd0]';
            case 'archive':
                return 'rounded-sm border border-stone-600 bg-[#f4f4f0]';
            case 'industrial':
                return 'rounded-none border-2 border-slate-600 bg-slate-100';
            case 'cyberpunk':
                return 'rounded-none border border-cyan-500 bg-black/90 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
            case 'glass':
                return 'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md text-white';
            case 'clay':
                return 'rounded-2xl bg-[#E0E5EC] text-[#4A5568]';
            case 'lofi':
                return 'rounded-xl border border-stone-300 bg-stone-50';
            case 'lab':
                return 'rounded-lg border border-blue-200 bg-white';
            default:
                return 'rounded-2xl bg-white border border-stone-200';
        }
    };

    if (!username) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 border border-dashed rounded-2xl ${variant === 'cyberpunk' ? 'bg-black border-cyan-500 text-cyan-500' : 'bg-stone-100 border-stone-300 text-stone-400'} ${className}`}>
                {getIcon()}
                <span className="text-xs font-bold uppercase mt-2">Connect Feed</span>
            </div>
        );
    }

    return (
        <div className={`w-full h-full overflow-hidden relative group scrollbar-hide overflow-y-auto ${getContainerStyles()} ${className}`}>
            <div className={`p-3 ${getHeaderColor()} text-white flex items-center justify-between sticky top-0 z-10`}>
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="font-bold text-xs">@{username}</span>
                </div>
                <div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Latest</div>
            </div>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className={`w-6 h-6 animate-spin ${variant === 'cyberpunk' ? 'text-cyan-500' : 'text-stone-300'}`} />
                    </div>
                ) : (
                    <>
                        <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full shrink-0 ${variant === 'cyberpunk' ? 'bg-cyan-900' : 'bg-stone-200'}`} />
                            <div className="space-y-2 w-full">
                                <div className={`h-2 w-20 rounded ${variant === 'cyberpunk' ? 'bg-cyan-900' : 'bg-stone-100'}`} />
                                <div className={`h-16 w-full rounded p-2 text-xs leading-relaxed ${variant === 'cyberpunk' ? 'bg-black border border-cyan-900 text-cyan-400' : 'bg-stone-50 text-stone-500'}`}>
                                    Just launched our new product collection! 🚀 Check it out now. properties. #launch #startup
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full shrink-0 ${variant === 'cyberpunk' ? 'bg-cyan-900' : 'bg-stone-200'}`} />
                            <div className="space-y-2 w-full">
                                <div className={`h-2 w-20 rounded ${variant === 'cyberpunk' ? 'bg-cyan-900' : 'bg-stone-100'}`} />
                                <div className={`aspect-video w-full rounded-lg ${variant === 'cyberpunk' ? 'bg-cyan-900/50' : 'bg-stone-100'}`} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
