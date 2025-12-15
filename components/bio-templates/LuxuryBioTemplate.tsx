import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { Gem, ArrowRight } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const LuxuryBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-serif p-8 selection:bg-[#D4AF37] selection:text-black">
            <div className="max-w-xl mx-auto border-x border-[#222] min-h-screen relative p-8">

                {/* Geometric Borders */}
                <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-[#D4AF37] opacity-60"></div>
                <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-[#D4AF37] opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-[#D4AF37] opacity-60"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-[#D4AF37] opacity-60"></div>

                {/* Header */}
                <header className="text-center mb-20 pt-12">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full border border-[#333] p-1">
                        <div className="w-full h-full rounded-full overflow-hidden grayscale contrast-125">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#111] flex items-center justify-center">
                                    <Gem className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-3 text-[#D4AF37]">
                        {profile.displayName}
                    </h1>
                    <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-4 opacity-50"></div>
                    <p className="text-[#666] text-sm uppercase tracking-[0.2em] font-sans">@{profile.handle}</p>

                    {profile.bio && (
                        <p className="mt-8 text-[#999] leading-loose italic max-w-sm mx-auto font-light text-lg">
                            "{profile.bio}"
                        </p>
                    )}
                </header>

                {/* Links */}
                <div className="space-y-8">
                    {links.map((link) => {
                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className="bg-[#111] p-1 border border-[#222]">
                                    <BioWidget link={link} />
                                </div>
                            )
                        }

                        return (
                            <a
                                key={link.id}
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block text-center py-4 border border-transparent hover:border-[#D4AF37] border-b-[#222] transition-colors duration-500"
                            >
                                <span className="font-sans text-sm tracking-[0.15em] uppercase group-hover:text-[#D4AF37] transition-colors duration-300">
                                    {link.title}
                                </span>
                            </a>
                        );
                    })}
                </div>

                {/* Blocks */}
                <div className="mt-24 space-y-12">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="text-center">
                            <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#444] mb-8">Selected Equipment</h3>
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    )}
                </div>

                <footer className="mt-20 text-center">
                    <Gem className="w-4 h-4 text-[#222] mx-auto" />
                </footer>

            </div>
        </div>
    );
};

export default LuxuryBioTemplate;
