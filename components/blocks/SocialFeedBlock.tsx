
import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, Linkedin, Loader2 } from 'lucide-react';

interface SocialFeedBlockProps {
    platform?: 'instagram' | 'twitter' | 'linkedin';
    username?: string;
}

export const SocialFeedBlock: React.FC<SocialFeedBlockProps> = ({ platform = 'twitter', username }) => {
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

    const getBgColor = () => {
        switch (platform) {
            case 'instagram': return 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500';
            case 'linkedin': return 'bg-[#0077b5]';
            case 'twitter':
            default: return 'bg-black';
        }
    };

    if (!username) {
        return (
            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-400 p-4 border border-dashed border-stone-300 rounded-2xl">
                {getIcon()}
                <span className="text-xs font-bold uppercase mt-2">Connect Feed</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-stone-200 relative group scrollbar-hide overflow-y-auto">
            <div className={`p-3 ${getBgColor()} text-white flex items-center justify-between sticky top-0 z-10`}>
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="font-bold text-xs">@{username}</span>
                </div>
                <div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Latest</div>
            </div>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
                    </div>
                ) : (
                    <>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                            <div className="space-y-2 w-full">
                                <div className="h-2 w-20 bg-stone-100 rounded" />
                                <div className="h-16 w-full bg-stone-50 rounded p-2 text-xs text-stone-500 leading-relaxed">
                                    Just launched our new product collection! 🚀 Check it out now. properties. #launch #startup
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                            <div className="space-y-2 w-full">
                                <div className="h-2 w-20 bg-stone-100 rounded" />
                                <div className="aspect-video w-full bg-stone-100 rounded-lg" />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
