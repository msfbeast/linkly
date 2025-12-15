import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ExternalLink, Moon, Sparkles } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';
import { ProductGrid } from './ProductGrid';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
    products?: Product[];
    activeTab?: 'links' | 'store';
}

const MidnightBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800 selection:text-white p-6">
            <div className="max-w-md mx-auto relative">

                {/* Glow Effects */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neutral-900 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                {/* Header */}
                <header className="relative z-10 flex flex-col items-center mb-12 pt-12">
                    <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-b from-neutral-700 to-black mb-6">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-700">
                                    <Moon className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-medium tracking-wide mb-2 text-neutral-200">{profile.displayName}</h1>
                    <p className="text-sm text-neutral-500 font-mono tracking-wider">@{profile.handle}</p>

                    {profile.bio && (
                        <p className="mt-4 text-center text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
                            {profile.bio}
                        </p>
                    )}
                </header>

                {/* Links or Store */}
                <div className="relative z-10">
                    {activeTab === 'store' ? (
                        <ProductGrid products={products} />
                    ) : (
                        <div className="space-y-4">
                            {links.map((link) => {
                                if (link.type !== 'link') {
                                    return (
                                        <div key={link.id} className="bg-neutral-950 border border-neutral-900 rounded-xl p-1 shadow-lg shadow-black/50">
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
                                        className="group flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 rounded-xl hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-300 shadow-lg shadow-black/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Simple Icon Placeholder */}
                                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-neutral-600 group-hover:text-white transition-colors border border-neutral-900">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-neutral-300 group-hover:text-white transition-colors">{link.title}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Blocks */}
                <div className="mt-8 space-y-8 relative z-10">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-6">Setup</h3>
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    )}

                    {(profile.blockVisibility?.appStack !== false) && (
                        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-6">Stack</h3>
                            <AppStackBlock userId={profile.userId} variant="default" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MidnightBioTemplate;
