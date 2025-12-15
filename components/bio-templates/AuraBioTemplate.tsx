import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ArrowUpRight, Sparkles } from 'lucide-react';
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

const AuraBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen font-sans text-white p-6 relative overflow-hidden">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 bg-slate-900">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.4),rgba(15,23,42,0))] animate-pulse"></div>
                <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] bg-purple-600 rounded-full blur-[120px] opacity-30 animate-blob mix-blend-screen"></div>
                <div className="absolute top-[20%] -right-[20%] w-[70%] h-[70%] bg-cyan-500 rounded-full blur-[120px] opacity-30 animate-blob animation-delay-2000 mix-blend-screen"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] bg-pink-600 rounded-full blur-[120px] opacity-30 animate-blob animation-delay-4000 mix-blend-screen"></div>
            </div>

            {/* Overlay Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay"></div>


            <div className="max-w-md mx-auto relative z-10">

                {/* Header */}
                <header className="text-center mb-10 pt-12">
                    <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-br from-purple-400 to-cyan-400 mb-6 shadow-xl shadow-purple-500/20">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-white/70" />
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-cyan-200">{profile.displayName}</h1>
                    <p className="text-purple-200/60 font-medium tracking-wide">@{profile.handle}</p>

                    {profile.bio && (
                        <p className="mt-4 text-white/80 leading-relaxed font-light">
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
                                        <div key={link.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-lg shadow-black/10">
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
                                        className="group relative block bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-white/5 to-purple-500/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-all duration-700 ease-in-out"></div>

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-cyan-200" />
                                                </div>
                                                <span className="font-semibold text-white/90 tracking-wide">{link.title}</span>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Blocks */}
                <div className="mt-10 space-y-6">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <TechVaultBlock userId={profile.userId} variant="glass" />
                        </div>
                    )}
                    {(profile.blockVisibility?.appStack !== false) && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                            <AppStackBlock userId={profile.userId} variant="glass" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AuraBioTemplate;
