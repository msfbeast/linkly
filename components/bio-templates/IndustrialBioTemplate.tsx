import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, CornerDownRight, Hexagon } from 'lucide-react';
import { BioWidget } from '../BioWidget';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const IndustrialBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] font-mono selection:bg-[#ff6b00] selection:text-black overflow-x-hidden">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-4">

                {/* Technical Header */}
                <div className="border-b-2 border-[#333] pb-8 mb-8 relative">
                    <div className="absolute top-0 right-0 text-[10px] text-[#666]">SYS.ID: {profile.id.substring(0, 8)}</div>

                    <div className="flex items-start gap-6 mt-6">
                        <div className="w-24 h-24 bg-[#2a2a2a] border border-[#444] relative shrink-0">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale contrast-125" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Hexagon className="w-8 h-8 text-[#444]" />
                                </div>
                            )}
                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ff6b00]"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#ff6b00]"></div>
                        </div>

                        <div className="flex-1 min-w-0 pt-2">
                            <h1 className="text-xl font-bold uppercase tracking-wider text-white truncate">{profile.displayName}</h1>
                            <div className="flex items-center gap-2 text-[#ff6b00] text-xs mt-1">
                                <CornerDownRight className="w-3 h-3" />
                                <span>@{profile.handle}</span>
                            </div>
                            {profile.bio && (
                                <p className="mt-3 text-xs text-[#888] leading-relaxed border-l-2 border-[#333] pl-3">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex justify-between items-center mb-8 text-[10px] uppercase text-[#555] tracking-widest">
                    <span>Status: Online</span>
                    <span>Links: {links.length}</span>
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-3 auto-rows-min">
                    {links.map((link, i) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className={`${style} bg-[#222] border border-[#333] overflow-hidden`}>
                                    <BioWidget link={link} />
                                </div>
                            );
                        }

                        return (
                            <a
                                key={link.id}
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${style} block bg-[#222] border border-[#333] p-4 hover:border-[#ff6b00] hover:bg-[#2a2a2a] transition-all group relative`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[#444] text-xs font-bold">0{i + 1}</span>
                                        <span className="font-bold text-sm uppercase tracking-wide group-hover:text-white transition-colors">
                                            {link.title}
                                        </span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-[#444] group-hover:text-[#ff6b00] transition-colors" />
                                </div>

                                {/* Progress Bar Effect */}
                                <div className="absolute bottom-0 left-0 h-[2px] bg-[#ff6b00] w-0 group-hover:w-full transition-all duration-300"></div>
                            </a>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 border-t border-[#333] pt-6 flex justify-between items-end">
                    <div className="text-[10px] text-[#444]">
                        <div>GATHER.SYSTEMS</div>
                        <div>V.2.0.24</div>
                    </div>
                    <div className="w-8 h-8 border border-[#333] flex items-center justify-center">
                        <div className="w-4 h-4 bg-[#ff6b00] animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndustrialBioTemplate;
