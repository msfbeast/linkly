import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { Gamepad, Zap, Play } from 'lucide-react';
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

const GamerBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-[#0d0d12] text-white font-sans selection:bg-[#00ff99] selection:text-black overflow-x-hidden">

            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF0055] via-[#00FF99] to-[#0099FF] z-50 shadow-[0_0_20px_rgba(0,255,153,0.5)]"></div>

            <div className="max-w-xl mx-auto p-6 relative z-10">

                {/* Profile Header */}
                <div className="relative mb-12 mt-8 p-1 bg-gradient-to-br from-[#FF0055] to-[#0099FF] rounded-2xl skew-x-[-2deg]">
                    <div className="bg-[#15151a] p-8 rounded-[14px] flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-xl border-2 border-[#333] relative overflow-visible">
                            <div className="absolute -inset-2 bg-gradient-to-r from-[#FF0055] to-[#0099FF] rounded-xl blur opacity-30 animate-pulse"></div>
                            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Gamepad className="w-8 h-8 text-[#00FF99]" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-[#00FF99] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase skew-x-[-10deg]">
                                ONLINE
                            </div>
                        </div>

                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-1 drop-shadow-[0_2px_10px_rgba(255,0,85,0.4)]">
                                {profile.displayName}
                            </h1>
                            <p className="text-[#00FF99] font-mono text-xs uppercase tracking-widest mb-4">
                                @{profile.handle} <span className="text-white/20">|</span> LVL 99
                            </p>
                            {profile.bio && (
                                <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Links or Store */}
                <div className="space-y-4">
                    {activeTab === 'store' ? (
                        <div className="relative bg-[#15151a] border border-[#2a2a35] p-3 rounded-lg">
                            <h2 className="text-[#00FF99] font-black italic tracking-tighter uppercase mb-4 text-center">
                                &lt; STORE /&gt;
                            </h2>
                            <ProductGrid products={products} />
                        </div>
                    ) : (
                        links.map((link) => {
                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className="relative bg-[#15151a] border border-[#2a2a35] p-1 rounded-lg">
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
                                    className="group relative block bg-[#15151a] hover:bg-[#1a1a20] border-l-4 border-[#333] hover:border-[#00FF99] p-4 transition-all duration-200 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#00FF99]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity skew-x-[-20deg] translate-x-10"></div>

                                    <div className="relative flex items-center justify-between z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#222] rounded text-[#FF0055] group-hover:text-[#00FF99] transition-colors">
                                                <Play className="w-4 h-4 fill-current" />
                                            </div>
                                            <span className="font-bold uppercase tracking-tight text-gray-200 group-hover:text-white group-hover:tracking-wide transition-all">
                                                {link.title}
                                            </span>
                                        </div>
                                        <Zap className="w-4 h-4 text-[#333] group-hover:text-[#00FF99] transition-colors" />
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>

                {/* Setup Block */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <div className="mt-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px bg-[#333] flex-1"></div>
                            <h3 className="font-black italic text-xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FF0055] to-[#0099FF]">
                                My Setup
                            </h3>
                            <div className="h-px bg-[#333] flex-1"></div>
                        </div>
                        <div className="bg-[#15151a] p-4 border border-[#2a2a35] rounded-xl relative overflow-hidden">
                            <div className="absoulte top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF0055] to-[#0099FF] opacity-50"></div>
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GamerBioTemplate;
