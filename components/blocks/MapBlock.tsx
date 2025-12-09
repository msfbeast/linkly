
import React from 'react';
import { MapPin } from 'lucide-react';

import { WidgetVariant } from '../../types';

interface MapBlockProps {
    lat?: number;
    lng?: number;
    address?: string;
    title?: string;
    variant?: WidgetVariant;
    className?: string;
}

export const MapBlock: React.FC<MapBlockProps> = ({ lat, lng, address, variant = 'default', className = '' }) => {
    // Use Google Maps Embed API (or simpler iframe for now)
    // For free/dev, simple OpenStreetMap iframe is easier

    const query = address ? encodeURIComponent(address) : '';
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.01}%2C${lat! - 0.01}%2C${lng! + 0.01}%2C${lat! + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

    if (!lat || !lng) {
        return (
            <div className={`w-full h-full bg-blue-50 flex flex-col items-center justify-center text-blue-400 p-4 border border-blue-100 rounded-2xl ${className}`}>
                <MapPin className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase">Location Missing</span>
            </div>
        );
    }

    const getContainerStyles = () => {
        switch (variant) {
            case 'neubrutalism':
            case 'bauhaus':
                return 'rounded-none border-2 border-black';
            case 'vibrant':
                return 'rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]';
            case 'clay':
                return 'rounded-3xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] border-none';
            case 'retro':
            case 'archive':
                return 'rounded-sm border-2 border-stone-800';
            case 'industrial':
                return 'rounded-sm border-2 border-slate-700 bg-slate-800';
            case 'cyberpunk':
                return 'rounded-none border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]';
            case 'lofi':
                return 'rounded-xl border border-stone-400';
            case 'lab':
                return 'rounded-lg border border-blue-200';
            default:
                return 'rounded-2xl';
        }
    };

    const getOverlayStyles = () => {
        switch (variant) {
            case 'glass':
                return 'bg-black/30 backdrop-blur-lg border-t border-white/10 text-white';
            case 'neubrutalism':
            case 'bauhaus':
                return 'bg-yellow-300 border-t-2 border-black text-black font-mono tracking-tight';
            case 'vibrant':
                return 'bg-yellow-300 border-t-4 border-black text-black font-black uppercase tracking-widest';
            case 'retro':
            case 'archive':
                return 'bg-[#f0e6d2] border-t-2 border-[#5c4033] text-[#5c4033] font-serif';
            case 'industrial':
                return 'bg-slate-800 border-t-2 border-slate-600 text-slate-200 font-mono';
            case 'cyberpunk':
                return 'bg-black/90 border-t border-cyan-500 text-cyan-400 font-mono tracking-wider';
            case 'clay':
                return 'bg-[#E0E5EC]/80 backdrop-blur-sm text-[#4A5568] border-none';
            case 'lofi':
                return 'bg-stone-100/90 border-t border-stone-300 text-stone-600 font-mono text-xs';
            case 'lab':
                return 'bg-blue-50/90 border-t border-blue-200 text-blue-700';
            default:
                return 'bg-white/90 backdrop-blur-sm border-t border-stone-200 text-slate-900';
        }
    };

    return (
        <div className={`w-full h-full overflow-hidden relative ${getContainerStyles()} ${className}`}>
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapUrl}
                className="w-full h-full"
            ></iframe>
            {variant === 'cyberpunk' && (
                <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-50"></div>
            )}
            <div className={`absolute bottom-0 left-0 right-0 p-3 z-20 ${getOverlayStyles()}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${variant === 'neubrutalism' ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>
                        <MapPin className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-bold truncate">{address || 'Location'}</p>
                </div>
            </div>
        </div>
    );
};
