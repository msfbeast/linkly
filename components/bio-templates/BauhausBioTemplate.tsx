import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Triangle, Circle, Square } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const BauhausBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#f0f0f0] text-[#1a1a1a] font-sans selection:bg-[#d12a2a] selection:text-white overflow-x-hidden">
            {/* Geometric Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-[#d12a2a]"></div>
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#2a5ad1]"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#e6b800]"></div>
            </div>

            {/* Mondrian Grid Background */}
            <div className="max-w-md mx-auto min-h-screen bg-[#f0f0f0] flex flex-col border-x-4 border-black relative">

                {/* Header Grid */}
                <div className="grid grid-cols-4 grid-rows-[auto_auto] gap-0 border-b-4 border-black">
                    {/* Avatar Block (2x2) */}
                    <div className="col-span-2 row-span-2 aspect-square border-r-4 border-black overflow-hidden relative group">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        ) : (
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                <span className="text-4xl font-black text-white">{profile.displayName.charAt(0)}</span>
                            </div>
                        )}
                        {/* Geometric Overlay */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-yellow-400 group-hover:border-r-red-600 transition-colors"></div>
                    </div>

                    {/* Name Block */}
                    <div className="col-span-2 bg-white p-4 flex flex-col justify-end border-b-4 border-black min-h-[100px]">
                        <h1 className="text-2xl font-black leading-none uppercase tracking-tighter">{profile.displayName}</h1>
                        <span className="text-xs font-bold bg-black text-white inline-block px-1 w-max mt-1">@{profile.handle}</span>
                    </div>

                    {/* Color Block Decoration */}
                    <div className="col-span-1 bg-yellow-400 border-r-4 border-black min-h-[60px]"></div>

                    {/* Bio Block */}
                    <div className="col-span-1 bg-white flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[length:4px_4px] opacity-20"></div>
                    </div>
                </div>

                {/* Bio Text Area */}
                {profile.bio && (
                    <div className="border-b-4 border-black p-6 bg-white relative">
                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-600"></div>
                        <p className="font-bold text-sm leading-relaxed max-w-[90%]">
                            {profile.bio}
                        </p>
                    </div>
                )}
                {/* Links */}
                <div className="flex-1 p-8 grid grid-cols-2 gap-0 auto-rows-min">
                    {links.map((link, i) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.originalUrl?.startsWith('widget://') || link.type !== 'link') {
                            return (
                                <BioWidget key={link.id} link={link} variant="bauhaus" />
                            );
                        }

                        return (
                            <a
                                key={link.id}
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${style} block p-6 border-b-2 border-[#1a1a1a] hover:bg-[#2a5ad1] hover:text-white transition-all group relative overflow-hidden`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-xl">{i + 1}.</span>
                                        <span className="font-bold text-lg uppercase tracking-tight">{link.title}</span>
                                    </div>
                                    <ArrowRightIcon className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" />
                                </div>
                            </a>
                        );
                    })}
                </div>


                {/* Tech Vault - auto-hides when empty */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <TechVaultBlock userId={profile.userId} variant="bauhaus" />
                )}

                {/* App Stack - auto-hides when empty */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <AppStackBlock userId={profile.userId} variant="bauhaus" />
                )}

                {/* Footer */}
                <div className="bg-[#e6b800] p-4 text-center">
                    <p className="font-black text-xs uppercase tracking-widest text-[#1a1a1a]">
                        Form Follows Function
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper icon component
const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

export default BauhausBioTemplate;
