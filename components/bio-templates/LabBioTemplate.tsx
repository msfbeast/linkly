import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, FlaskConical, Microscope } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const LabBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-white text-[#333] font-mono selection:bg-[#00f0ff] selection:text-black overflow-x-hidden">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}>
            </div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6 border-x border-[#e5e5e5] bg-white/50 backdrop-blur-sm">

                {/* Header */}
                <div className="mb-12 border border-[#333] p-6 bg-white relative">
                    <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-[#0066ff]">SUBJECT_INFO</div>

                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 border border-[#333] p-1 shrink-0">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover grayscale" />
                            ) : (
                                <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center">
                                    <FlaskConical className="w-8 h-8 text-[#999]" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 pt-1">
                            <h1 className="text-xl font-bold uppercase tracking-tight mb-1">{profile.displayName}</h1>
                            <div className="text-xs text-[#666] mb-2 font-bold">ID: {profile.handle}</div>
                            {profile.bio && (
                                <p className="text-xs leading-relaxed text-[#444]">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div className="flex-1 space-y-3">
                    <div className="text-xs font-bold text-[#0066ff] mb-2 uppercase tracking-wider pl-1">Access_Points</div>
                    <div className="grid grid-cols-2 gap-3 auto-rows-min">
                        {links.map((link, i) => {
                            const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className={`${style} border border-[#e5e5e5] overflow-hidden`}>
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
                                    className={`${style} flex items-center gap-4 p-3 border border-[#e5e5e5] hover:border-[#0066ff] hover:bg-[#f0f8ff] transition-colors group`}
                                >
                                    <span className="text-xs font-bold text-[#999] group-hover:text-[#0066ff] w-6">
                                        {(i + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className="flex-1 text-sm font-bold truncate">
                                        {link.title}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-[#999] group-hover:text-[#0066ff]" />
                                </a>
                            );
                        })}
                    </div>
                </div>


                {/* Tech Vault - auto-hides when empty */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <TechVaultBlock userId={profile.userId} variant="lab" />
                )}

                {/* App Stack - auto-hides when empty */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <AppStackBlock userId={profile.userId} variant="lab" />
                )}

                {/* Footer */}
                <div className="mt-16 border-t border-[#e5e5e5] pt-4 flex justify-between items-center text-[10px] text-[#999]">
                    <div className="flex items-center gap-2">
                        <Microscope className="w-3 h-3" />
                        <span>Research Div.</span>
                    </div>
                    <div>SECURE_CONNECTION</div>
                </div>
            </div>
        </div>
    );
};

export default LabBioTemplate;
