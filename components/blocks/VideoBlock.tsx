
import React from 'react';
import { Play } from 'lucide-react';

interface VideoBlockProps {
    videoId?: string;
    platform?: 'youtube' | 'vimeo';
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ videoId, platform = 'youtube' }) => {
    if (!videoId) {
        return (
            <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-stone-500 p-4 rounded-2xl">
                <Play className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase">No Video</span>
            </div>
        );
    }

    const src = platform === 'youtube'
        ? `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1`
        : `https://player.vimeo.com/video/${videoId}`;

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative group">
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
