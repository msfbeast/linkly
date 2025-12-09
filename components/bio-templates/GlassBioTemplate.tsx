import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const GlassBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden relative">
            {/* Ambient Background */}
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-500/[0.15] rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/[0.15] rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-white/[0.05] rounded-full blur-[100px] animate-pulse-slow delay-500"></div>
            </div>

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-16 px-6">

                {/* Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="relative group mb-8">
                        {/* Outer Glow Ring */}
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-white/40 to-transparent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-3xl shadow-2xl ring-1 ring-white/20 relative z-10">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black/20 text-3xl font-light text-white/80">
                                        {profile.displayName.charAt(0)}
                                    </div>
                                )}
                                {/* Glossy Reflection */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-thin tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm">{profile.displayName}</h1>
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md mb-8 hover:bg-white/10 transition-colors">
                        <p className="text-white/60 text-xs font-medium tracking-widest uppercase">@{profile.handle}</p>
                    </div>

                    {profile.bio && (
                        <p className="text-white/70 text-center leading-relaxed font-light max-w-xs backdrop-blur-sm py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min">
                    {links.map((link) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className={`${style} rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden`}>
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
                                className={`${style} group block relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 backdrop-blur-md`}
                            >
                                <div className="relative z-10 p-5 flex items-center justify-between">
                                    <span className="font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                                        {link.title}
                                    </span>
                                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                                </div>

                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                            </a>
                        );
                    })}
                </div>

                {/* Tech Vault - auto-hides when empty */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <TechVaultBlock userId={profile.userId} variant="glass" />
                )}

                {/* App Stack - auto-hides when empty */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <AppStackBlock userId={profile.userId} variant="glass" />
                )}

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-light">
                        Powered by Gather
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GlassBioTemplate;
