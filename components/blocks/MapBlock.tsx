
import React from 'react';
import { MapPin } from 'lucide-react';

interface MapBlockProps {
    lat?: number;
    lng?: number;
    address?: string;
    title?: string;
}

export const MapBlock: React.FC<MapBlockProps> = ({ lat, lng, address }) => {
    // Use Google Maps Embed API (or simpler iframe for now)
    // For free/dev, simple OpenStreetMap iframe is easier

    const query = address ? encodeURIComponent(address) : '';
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.01}%2C${lat! - 0.01}%2C${lng! + 0.01}%2C${lat! + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

    if (!lat || !lng) {
        return (
            <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center text-blue-400 p-4 border border-blue-100 rounded-2xl">
                <MapPin className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold uppercase">Location Missing</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative">
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
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t border-stone-200">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500 rounded-full text-white">
                        <MapPin className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{address || 'Location'}</p>
                </div>
            </div>
        </div>
    );
};
