
import React from 'react';
import { Music } from 'lucide-react';

interface MusicBlockProps {
    url?: string;
    platform?: 'spotify' | 'apple';
    compact?: boolean;
}

export const MusicBlock: React.FC<MusicBlockProps> = ({ url, platform = 'spotify', compact }) => {
    if (!url) {
        return (
            <div className="w-full h-full bg-stone-100 flex flex-col items-center justify-center text-stone-400 p-4">
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

    return (
        <div className={`w-full h-full rounded-2xl overflow-hidden bg-black ${compact ? 'min-h-[152px]' : 'min-h-[320px]'}`}>
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
