import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Terminal, Cpu } from 'lucide-react';
import { GalleryBlock } from '../blocks/GalleryBlock';
import { BioWidget } from '../BioWidget';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const CyberpunkBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black overflow-x-hidden">
            {/* CRT Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            {/* Glow Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#00ff41] rounded-full blur-[150px] opacity-10"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-[#00ff41] rounded-full blur-[150px] opacity-10"></div>
            </div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6">

                {/* Header */}
                <div className="mb-12 relative group">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[#00ff41] opacity-50"></div>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 border-2 border-[#00ff41] relative overflow-hidden">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale contrast-150 hover:grayscale-0 transition-all" />
                            ) : (
                                <div className="w-full h-full bg-[#001a05] flex items-center justify-center">
                                    <Terminal className="w-8 h-8" />
                                </div>
                            )}
                            {/* Glitch Overlay */}
                            <div className="absolute inset-0 bg-[#00ff41] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tighter uppercase glitch-text" data-text={profile.displayName}>
                                {profile.displayName}
                            </h1>
                            <p className="text-xs text-[#00ff41]/60 mt-1 flex items-center gap-2">
                                <Cpu className="w-3 h-3" />
                                <span>NET_ID: {profile.handle}</span>
                            </p>
                        </div>
                    </div>

                    {profile.bio && (
                        <div className="bg-[#001a05] border border-[#00ff41]/30 p-4 text-xs leading-relaxed relative">
                            <span className="absolute -top-2 left-2 bg-[#050505] px-1 text-[#00ff41]/50 text-[10px]">BIO_DATA</span>
                            {profile.bio}
                        </div>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min">
                    {links.map((link, i) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.originalUrl?.startsWith('widget://') || link.type !== 'link') {
                            return (
                                <BioWidget key={link.id} link={link} variant="cyberpunk" />
                            );
                        }

                        return (
                            <a
                                key={link.id}
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${style} block bg-black border border-[#00ff41] p-4 hover:bg-[#00ff41] hover:text-black transition-all group relative overflow-hidden`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] opacity-60 mb-1 group-hover:text-black/60">LINK_0{i + 1}</span>
                                        <span className="font-bold uppercase tracking-wide">{link.title}</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4" />
                                </div>

                                {/* Scanline on Hover */}
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                            </a>
                        );
                    })}
                </div>

                {/* Tech Vault (Gallery) */}
                {(profile.blockVisibility?.gallery !== false) && (
                    <div className="mb-12 border border-[#00ff41]/20 rounded p-4 bg-black/40 backdrop-blur relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00ff41]"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00ff41]"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]"></div>

                        <h3 className="text-[#00ff41] text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Tech_Vault.exe
                        </h3>
                        <GalleryBlock userId={profile.userId} />
                    </div>
                )}

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-[10px] text-[#00ff41]/40 uppercase tracking-[0.3em] animate-pulse">
                        System Online
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CyberpunkBioTemplate;
