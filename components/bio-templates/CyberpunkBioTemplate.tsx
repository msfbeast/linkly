import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Terminal, Cpu } from 'lucide-react';
import { GalleryBlock } from '../blocks/GalleryBlock';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const CyberpunkBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black overflow-x-hidden">
            {/* CRT Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#00ff41] rounded-full blur-[150px] opacity-10"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-[#00ff41] rounded-full blur-[150px] opacity-10"></div>
            </div>

            {/* CRT Scanline Overlay */}
            <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>

            {/* Vignette */}
            <div className="fixed inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6))]"></div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6">

                {/* Header */}
                <div className="mb-12 relative">
                    <div className="absolute -left-4 top-0 w-1 h-24 bg-gradient-to-b from-cyan-500 to-transparent"></div>

                    <div className="flex items-end gap-6 mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 bg-black border-2 border-cyan-500 relative z-10 overflow-hidden">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black text-cyan-500">
                                        <Terminal className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            {/* Glitch Offset Layers */}
                            <div className="absolute inset-0 border-2 border-[#ff003c] translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
                            <div className="absolute inset-0 border-2 border-[#f0f] -translate-x-1 -translate-y-1 -z-20 group-hover:-translate-x-2 group-hover:-translate-y-2 transition-transform"></div>
                        </div>

                        <div className="flex-1 pb-1">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-1 shadow-[2px_2px_0px_#00ffff] text-shadow-neon">
                                {profile.displayName}
                            </h1>
                            <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-500">
                                <span className="animate-pulse">●</span>
                                <span>NET_ID: @{profile.handle}</span>
                            </div>
                        </div>
                    </div>

                    {profile.bio && (
                        <div className="border border-cyan-900/50 bg-black/50 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
                            <p className="text-cyan-100/80 font-mono text-sm leading-relaxed relative z-10">
                                <span className="text-cyan-600 mr-2">{'>'}</span>
                                {profile.bio}
                                <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-cyan-500 align-middle"></span>
                            </p>
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

                {/* Tech Vault - auto-hides when empty */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <TechVaultBlock userId={profile.userId} variant="cyberpunk" />
                )}

                {/* App Stack - auto-hides when empty */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <AppStackBlock userId={profile.userId} variant="cyberpunk" />
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
