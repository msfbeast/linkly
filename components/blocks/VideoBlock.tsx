
import React from 'react';
import { Play } from 'lucide-react';

import { WidgetVariant } from '../../types';

interface VideoBlockProps {
    videoId?: string;
    platform?: 'youtube' | 'vimeo';
    variant?: WidgetVariant;
    className?: string;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ videoId, platform = 'youtube', variant = 'default', className = '' }) => {
    if (!videoId) {
        return (
            <div className={`w-full h-full bg-stone-900 flex flex-col items-center justify-center text-stone-500 p-4 rounded-2xl ${className}`}>
                <Play className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase">No Video</span>
            </div>
        );
    }

    const src = platform === 'youtube'
        ? `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1`
        : `https://player.vimeo.com/video/${videoId}`;

    const getContainerStyles = () => {
        switch (variant) {
            case 'neubrutalism':
                return 'rounded-none border-2 border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
            case 'vibrant':
                return 'rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-black';
            case 'clay':
                return 'rounded-3xl bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none';
            case 'bauhaus':
                return 'rounded-none border-4 border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
            case 'retro':
                return 'rounded-sm border-2 border-stone-800 bg-stone-900';
            case 'archive':
                return 'rounded-sm border border-stone-600 bg-stone-900';
            case 'industrial':
                return 'rounded-none border-2 border-slate-600 bg-slate-900';
            case 'cyberpunk':
                return 'rounded-none border border-cyan-500 bg-black shadow-[0_0_15px_rgba(6,182,212,0.3)]';
            case 'glass':
                return 'rounded-2xl border border-white/10 bg-black/50 backdrop-blur';
            case 'lofi':
                return 'rounded-xl border border-stone-300 bg-stone-50';
            case 'lab':
                return 'rounded-lg border border-blue-200 bg-blue-50';
            default:
                return 'rounded-2xl bg-black';
        }
    };

    return (
        <div className={`w-full h-full overflow-hidden relative group ${getContainerStyles()} ${className}`}>
            <iframe
                src={src}
                className="w-full h-full absolute inset-0"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};
