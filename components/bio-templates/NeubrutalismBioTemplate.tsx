import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const NeubrutalismBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#FFDEE9] text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6">

                {/* Header */}
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 transform -rotate-1">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-[#B5FFFC] border-4 border-black rounded-none flex items-center justify-center shrink-0">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-black">{profile.displayName.charAt(0)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1 truncate">
                                {profile.displayName}
                            </h1>
                            <div className="bg-black text-white inline-block px-2 py-0.5 text-sm font-bold transform rotate-2">
                                @{profile.handle}
                            </div>
                        </div>
                    </div>

                    {profile.bio && (
                        <div className="mt-6 pt-4 border-t-4 border-black">
                            <p className="font-bold text-lg leading-tight">
                                {profile.bio}
                            </p>
                        </div>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 grid grid-cols-2 gap-5 auto-rows-min">
                    {links.map((link, i) => {
                        const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className={`${style} bg-${['#FF9A9E', '#FECFEF', '#E0C3FC', '#8EC5FC'][i % 4] || 'white'} border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} overflow-hidden`}>
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
                                className={`${style} block bg-${['#FF9A9E', '#FECFEF', '#E0C3FC', '#8EC5FC'][i % 4] || 'white'} border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-lg uppercase tracking-tight">
                                        {link.title}
                                    </span>
                                    <div className="bg-black text-white p-1">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Tech Vault - auto-hides when empty */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <TechVaultBlock userId={profile.userId} variant="neubrutalism" />
                )}

                {/* App Stack - auto-hides when empty */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <AppStackBlock userId={profile.userId} variant="neubrutalism" />
                )}

                {/* Footer */}
                <div className="mt-16 text-center">
                    <div className="inline-block bg-white border-2 border-black px-4 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Built with Gather
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeubrutalismBioTemplate;
