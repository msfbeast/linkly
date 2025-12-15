import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ArrowUpRight, Grid, Disc } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const SwissBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans selection:bg-red-500 selection:text-white p-4 md:p-12">
            <div className="max-w-3xl mx-auto">
                {/* Header Grid */}
                <header className="mb-20 grid grid-cols-12 gap-4 border-t-4 border-black pt-8">
                    <div className="col-span-12 md:col-span-8">
                        <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none mb-6">
                            {profile.displayName.split(' ')[0]}<br />
                            <span className="text-red-600">{profile.displayName.split(' ')[1] || ''}</span>.
                        </h1>
                        <div className="flex items-center gap-4 text-sm font-bold tracking-widest uppercase">
                            <span className="bg-black text-white px-3 py-1">@{profile.handle}</span>
                            <span>Portfolio & Links</span>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-4 flex flex-col justify-between items-end">
                        <div className="w-24 h-24 bg-neutral-200 grayscale contrast-125 rounded-full overflow-hidden mb-4">
                            {profile.avatarUrl && (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <Disc className="w-12 h-12 animate-spin-slow opacity-20" />
                    </div>
                </header>

                {/* Bio Grid */}
                {profile.bio && (
                    <div className="grid grid-cols-12 gap-4 mb-16">
                        <div className="col-span-1 border-t border-black pt-2 hidden md:block">
                            <span className="text-xs font-bold">01</span>
                        </div>
                        <div className="col-span-11 md:col-span-6 border-t border-black pt-2">
                            <p className="text-2xl font-medium leading-normal">
                                {profile.bio}
                            </p>
                        </div>
                    </div>
                )}

                {/* Links Section */}
                <section className="mb-20">
                    <div className="grid grid-cols-12 gap-4 mb-4">
                        <div className="col-span-12 md:col-span-2 text-xs font-bold uppercase tracking-widest border-b border-black pb-2">
                            Index
                        </div>
                        <div className="col-span-12 md:col-span-8 text-xs font-bold uppercase tracking-widest border-b border-black pb-2 text-right md:text-left">
                            Title
                        </div>
                        <div className="col-span-0 md:col-span-2 text-xs font-bold uppercase tracking-widest border-b border-black pb-2 text-right hidden md:block">
                            Action
                        </div>
                    </div>

                    <div className="space-y-0">
                        {links.map((link, i) => {
                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className="py-8 border-b border-neutral-300">
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
                                    className="group grid grid-cols-12 gap-4 py-6 border-b border-neutral-200 hover:border-black hover:bg-white transition-all items-center"
                                >
                                    <div className="col-span-2 md:col-span-2 font-mono text-sm text-neutral-400 group-hover:text-red-500 transition-colors">
                                        {(i + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="col-span-8 md:col-span-8 text-2xl font-bold tracking-tight group-hover:translate-x-2 transition-transform">
                                        {link.title}
                                    </div>
                                    <div className="col-span-2 md:col-span-2 flex justify-end">
                                        <ArrowUpRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:rotate-45" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* Tech Vault */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <div className="mb-16 border-t-4 border-black pt-8">
                        <h3 className="text-4xl font-black mb-8">EQUIPMENT</h3>
                        <TechVaultBlock userId={profile.userId} variant="default" />
                    </div>
                )}

                {/* App Stack */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <div className="mb-16 border-t-4 border-black pt-8">
                        <h3 className="text-4xl font-black mb-8">SOFTWARE</h3>
                        <AppStackBlock userId={profile.userId} variant="default" />
                    </div>
                )}

            </div>
        </div>
    );
};

export default SwissBioTemplate;
