import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ExternalLink, Star, Zap, Music, Play, ShoppingBag } from 'lucide-react';
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

const NeoPopBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-yellow-300 text-slate-900 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden p-4">

            {/* Animated Marquee Header */}
            <div className="fixed top-0 left-0 right-0 bg-black text-white py-2 z-50 overflow-hidden whitespace-nowrap border-b-4 border-black">
                <div className="inline-flex animate-marquee">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-sm font-black uppercase mx-8 flex items-center gap-4">
                            CHECK OUT MY LINKS <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" /> NEW UPDATES
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-md mx-auto relative pt-20 pb-12">

                {/* Profile Section */}
                <div className="bg-white border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 text-center relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 text-pink-500 animate-spin-slow">
                        <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-cyan-400">
                        <Star className="w-6 h-6 fill-current" />
                    </div>

                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-black overflow-hidden mb-4 bg-yellow-100 relative z-10">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-black">
                                {profile.displayName.charAt(0)}
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 transform -rotate-2">{profile.displayName}</h1>
                    <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm tracking-widest uppercase mb-4 transform rotate-1">
                        @{profile.handle}
                    </div>

                    {profile.bio && (
                        <p className="font-bold text-lg leading-tight max-w-xs mx-auto">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links or Store */}
                <div className="space-y-4">
                    {activeTab === 'store' ? (
                        <div className="bg-white border-4 border-black p-4 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center justify-center gap-2 mb-4 border-b-4 border-black pb-2">
                                <ShoppingBag className="w-6 h-6" />
                                <h3 className="font-black text-xl uppercase">MERCH DROP</h3>
                            </div>
                            <ProductGrid products={products} />
                        </div>
                    ) : (
                        links.map((link, i) => {
                            const colors = ['bg-pink-400', 'bg-cyan-400', 'bg-white', 'bg-lime-400'];
                            const bgColor = colors[i % colors.length];
                            const rotate = (i % 2 === 0) ? 'rotate-1' : '-rotate-1';

                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className={`${bgColor} border-4 border-black p-1 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
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
                                    className={`block ${bgColor} border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group ${rotate} hover:rotate-0`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-xl uppercase tracking-tight">{link.title}</span>
                                        <div className="bg-black text-white p-2 rounded-lg border-2 border-white/20 group-hover:scale-110 transition-transform">
                                            <ExternalLink className="w-5 h-5" />
                                        </div>
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>

                {/* Tech Vault */}
                {(profile.blockVisibility?.techVault !== false) && (
                    <div className="mt-8 bg-white border-4 border-black rounded-[2rem] p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
                            <span className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase">Gear</span>
                            <h3 className="font-black text-xl uppercase">My Setup</h3>
                        </div>
                        <TechVaultBlock userId={profile.userId} variant="neubrutalism" />
                    </div>
                )}

                {/* App Stack */}
                {(profile.blockVisibility?.appStack !== false) && (
                    <div className="mt-8">
                        <AppStackBlock userId={profile.userId} variant="default" />
                    </div>
                )}

                <div className="mt-12 text-center pb-8">
                    <p className="font-black uppercase tracking-widest text-xs opacity-50">Built with Gather</p>
                </div>
            </div>
        </div>
    );
};

export default NeoPopBioTemplate;
