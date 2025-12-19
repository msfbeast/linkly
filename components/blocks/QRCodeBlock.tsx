import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import { LinkData, BioProfile } from '../../types';

interface QRCodeBlockProps {
    link: LinkData;
    profile?: BioProfile;
}

export const QRCodeBlock: React.FC<QRCodeBlockProps> = ({ link, profile }) => {
    // Determine the URL to encode. If metadata.url is provided, use it. 
    // Otherwise, default to the profile handle if available.
    const baseUrl = window.location.origin;
    const qrUrl = link.metadata?.url || (profile ? `${baseUrl}/p/${profile.handle}` : baseUrl);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-white h-full min-h-[160px]">
            <div className="relative p-2 bg-white rounded-xl shadow-sm border border-stone-100 mb-2">
                <QRCodeSVG
                    value={qrUrl}
                    size={120}
                    level="H"
                    includeMargin={false}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1 rounded-full shadow-sm">
                        <QrCode className="w-4 h-4 text-indigo-500" />
                    </div>
                </div>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">
                Scan to Visit
            </p>
        </div>
    );
};

export default QRCodeBlock;
