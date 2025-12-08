import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Triangle, Circle, Square } from 'lucide-react';
import { BioWidget } from '../BioWidget';

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

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col bg-white shadow-2xl min-h-screen">

                {/* Header */}
                <div className="p-8 pb-12 bg-[#1a1a1a] text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-50">
                        <Triangle className="w-4 h-4 fill-current text-[#e6b800]" />
                        <Circle className="w-4 h-4 fill-current text-[#d12a2a]" />
                        <Square className="w-4 h-4 fill-current text-[#2a5ad1]" />
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                        <div className="w-24 h-24 bg-white rounded-full p-1 mb-6">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#f0f0f0]">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#1a1a1a] font-black text-2xl">
                                        {profile.displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">{profile.displayName}</h1>
                        <p className="font-medium text-[#e6b800]">@{profile.handle}</p>
                    </div>
                </div>

                {/* Bio Section */}
                {profile.bio && (
                    <div className="bg-[#d12a2a] p-6 text-white text-center font-medium leading-relaxed">
                        {profile.bio}
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
