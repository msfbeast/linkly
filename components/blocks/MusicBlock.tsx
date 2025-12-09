
import React from 'react';
import { Music } from 'lucide-react';

import { WidgetVariant } from '../../types';

interface MusicBlockProps {
    url?: string;
    platform?: 'spotify' | 'apple';
    compact?: boolean;
    variant?: WidgetVariant;
    className?: string;
}

export const MusicBlock: React.FC<MusicBlockProps> = ({ url, platform = 'spotify', compact, variant = 'default', className = '' }) => {
    if (!url) {
        return (
            <div className={`w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-400 p-4 ${className}`}>
                <Music className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase">No Music URL</span>
            </div>
        );
    }

    // Simple Embed Logic (In replaced with real regex in production)
    // Converting standard URLs to Embed URLs
    let embedUrl = url;
    if (platform === 'spotify') {
        // https://open.spotify.com/track/123 -> https://open.spotify.com/embed/track/123
        embedUrl = url.replace('spotify.com/', 'spotify.com/embed/');
    } else if (platform === 'apple') {
        // https://music.apple.com/us/album/xyz -> https://embed.music.apple.com/us/album/xyz
        embedUrl = url.replace('music.apple.com/', 'embed.music.apple.com/');
    }

    const getContainerStyles = () => {
        switch (variant) {
            case 'neubrutalism':
                return 'rounded-none border-2 border-black bg-black';
            case 'vibrant':
                return 'rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white';
            case 'clay':
                return 'rounded-3xl bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none';
            case 'bauhaus':
                return 'rounded-none border-4 border-black bg-black';
            case 'retro':
                return 'rounded-sm border-2 border-stone-800 bg-black';
            case 'archive':
                return 'rounded-sm border border-stone-600 bg-black';
            case 'industrial':
                return 'rounded-none border-2 border-slate-600 bg-black';
            case 'cyberpunk':
                return 'rounded-none border border-cyan-500 bg-black shadow-[0_0_15px_rgba(6,182,212,0.6)]';
            case 'glass':
                return 'rounded-2xl border border-white/20 bg-black/50 backdrop-blur';
            case 'lofi':
                return 'rounded-xl border-2 border-stone-300 bg-white';
            case 'lab':
                return 'rounded-lg border border-blue-200 bg-white';
            default:
                return 'rounded-2xl bg-black';
        }
    };

    return (
        <div className={`w-full h-full overflow-hidden ${getContainerStyles()} ${compact ? 'min-h-[152px]' : 'min-h-[320px]'} ${className}`}>
            <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full h-full"
            />
        </div>
    );
};
