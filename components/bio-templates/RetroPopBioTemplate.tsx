import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, MousePointer2 } from 'lucide-react';
import { BioWidget } from '../BioWidget';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const RetroPopBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#E6E1D6] text-[#2C2C2C] font-sans selection:bg-[#000080] selection:text-white overflow-x-hidden">
            {/* Windows 95 Style Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}>
            </div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-8 px-4">

                {/* Window Frame for Profile */}
                <div className="bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black shadow-xl mb-8">
                    {/* Title Bar */}
                    <div className="bg-[#000080] px-2 py-1 flex justify-between items-center">
                        <span className="text-white font-bold text-sm tracking-wide">Profile.exe</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-[10px] font-bold">_</div>
                            <div className="w-4 h-4 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-[10px] font-bold">□</div>
                            <div className="w-4 h-4 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-[10px] font-bold">×</div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 text-center">
                        <div className="w-24 h-24 mx-auto bg-white border-2 border-[#808080] shadow-inner mb-4 relative">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#008080] text-white font-bold text-2xl">
                                    {profile.displayName.charAt(0)}
                                </div>
                            )}
                            {/* Pixelated Corner Decorations */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-black"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-black"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-black"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"></div>
                        </div>

                        <h1 className="text-2xl font-bold font-serif mb-1">{profile.displayName}</h1>
                        <p className="text-sm text-[#000080] underline mb-4 hover:bg-[#000080] hover:text-white inline-block px-1 cursor-pointer">
                            @{profile.handle}
                        </p>

                        {profile.bio && (
                            <div className="bg-white border-2 border-[#808080] shadow-inner p-3 text-sm text-left font-mono max-h-24 overflow-y-auto custom-scrollbar-retro">
                                {profile.bio}
                            </div>
                        )}
                    </div>
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min">
                    {links.map((link) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className={`${style} bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1`}>
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
                                className={`${style} block bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1 active:border-t-black active:border-l-black active:border-b-white active:border-r-white active:bg-[#B0B0B0] group`}
                            >
                                <div className="flex items-center gap-3 px-3 py-2 border border-dotted border-transparent group-focus:border-black group-hover:border-black/20">
                                    <div className="w-8 h-8 bg-white border border-[#808080] flex items-center justify-center">
                                        <ExternalLink className="w-4 h-4 text-[#000080]" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wide">{link.title}</span>
                                    <MousePointer2 className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center border-t border-[#808080] pt-4">
                    <p className="text-xs font-serif italic text-[#666]">
                        Copyright © 1999 Gather Inc.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RetroPopBioTemplate;
