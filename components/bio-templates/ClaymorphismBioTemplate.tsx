import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Cloud } from 'lucide-react';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const ClaymorphismBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#E0E5EC] text-[#4A5568] font-sans selection:bg-[#A3B1C6] selection:text-white overflow-x-hidden">
            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-8">

                {/* Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] p-2 mb-8 flex items-center justify-center">
                        <div className="w-full h-full rounded-[2rem] overflow-hidden">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#E0E5EC] flex items-center justify-center text-[#A3B1C6]">
                                    <Cloud className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-[#2D3748] mb-2 tracking-tight">{profile.displayName}</h1>
                    <p className="text-[#718096] font-medium mb-6 bg-[#E0E5EC] px-4 py-1 rounded-full shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff]">
                        @{profile.handle}
                    </p>

                    {profile.bio && (
                        <p className="text-center text-[#4A5568] leading-relaxed max-w-xs">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 space-y-6">
                    {links.map((link) => (
                        <a
                            key={link.id}
                            href={`/r/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-[#E0E5EC] p-5 rounded-2xl shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] hover:shadow-[inset_9px_9px_16px_rgb(163,177,198,0.6),inset_-9px_-9px_16px_rgba(255,255,255,0.5)] hover:scale-[0.98] transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-[#2D3748] group-hover:text-[#4A5568] transition-colors">
                                    {link.title}
                                </span>
                                <ExternalLink className="w-4 h-4 text-[#A3B1C6] group-hover:text-[#718096]" />
                            </div>
                        </a>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-xs font-bold text-[#A3B1C6] uppercase tracking-widest">
                        Soft & Smooth
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClaymorphismBioTemplate;
