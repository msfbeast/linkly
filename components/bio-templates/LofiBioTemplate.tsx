import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Music, Coffee } from 'lucide-react';
import { BioWidget } from '../BioWidget';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const LofiBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#f3e7e4] text-[#5d576b] font-sans selection:bg-[#d4a373] selection:text-white overflow-x-hidden">
            {/* Soft Gradient Background */}
            <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-[#f3e7e4] via-[#e2d4d8] to-[#d8c3c9]"></div>

            {/* Grain Overlay */}
            <div className="fixed inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-16 px-8">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover sepia-[0.3]" />
                        ) : (
                            <div className="w-full h-full bg-[#d4a373] flex items-center justify-center text-white text-3xl">
                                <Coffee className="w-10 h-10" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold text-[#4a4e69] mb-2 tracking-wide font-serif italic">{profile.displayName}</h1>
                    <p className="text-[#9a8c98] text-sm mb-6">@{profile.handle}</p>

                    {profile.bio && (
                        <div className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm">
                            <p className="text-[#4a4e69] leading-relaxed font-medium">
                                {profile.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min">
                    {links.map((link) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className={`${style} bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm overflow-hidden`}>
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
                                className={`${style} block bg-white/60 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/80 hover:scale-[1.02] transition-all duration-300 group`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-[#4a4e69] group-hover:text-[#22223b] transition-colors">
                                        {link.title}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-[#9a8c98] group-hover:text-[#4a4e69]" />
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-16 text-center flex items-center justify-center gap-2 text-[#9a8c98] text-sm">
                    <Music className="w-4 h-4" />
                    <span>vibing with gather</span>
                </div>
            </div>
        </div>
    );
};

export default LofiBioTemplate;
