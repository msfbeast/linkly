import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, ArrowUpRight } from 'lucide-react';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const GlassBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white/[0.03] rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px]"></div>
            </div>

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-16 px-6">

                {/* Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-b from-white/20 to-transparent mb-6">
                        <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 relative">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-2xl font-light">
                                    {profile.displayName.charAt(0)}
                                </div>
                            )}
                            {/* Glass Shine on Avatar */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-light tracking-tight mb-2">{profile.displayName}</h1>
                    <p className="text-white/40 text-sm font-mono tracking-widest uppercase mb-6">@{profile.handle}</p>

                    {profile.bio && (
                        <p className="text-white/70 text-center leading-relaxed font-light max-w-xs backdrop-blur-sm py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 space-y-4">
                    {links.map((link) => (
                        <a
                            key={link.id}
                            href={`/r/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 backdrop-blur-md"
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
                    ))}
                </div>

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
