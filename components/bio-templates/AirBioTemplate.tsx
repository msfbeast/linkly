import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { Cloud, Wind, ArrowRight } from 'lucide-react';
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

const AirBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-sky-50 text-sky-900 font-sans p-6 relative overflow-hidden">

            {/* Animated Clouds Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] text-white/40 animate-pulse delay-700">
                    <Cloud className="w-24 h-24 fill-current" />
                </div>
                <div className="absolute top-[20%] right-[15%] text-white/30 animate-pulse delay-1000">
                    <Cloud className="w-16 h-16 fill-current" />
                </div>
                <div className="absolute bottom-[20%] left-[5%] text-white/50 animate-pulse delay-500">
                    <Cloud className="w-32 h-32 fill-current" />
                </div>
                {/* Floating Gradient Orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="max-w-md mx-auto relative z-10">

                {/* Header */}
                <header className="text-center mb-12 pt-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-[2rem] shadow-xl shadow-sky-200 p-1 transform -rotate-3 hover:rotate-0 transition-all duration-500">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover rounded-[1.8rem]" />
                        ) : (
                            <div className="w-full h-full bg-sky-100 flex items-center justify-center rounded-[1.8rem]">
                                <Wind className="w-8 h-8 text-sky-400" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-black text-sky-900 mb-2 tracking-tight">{profile.displayName}</h1>
                    <span className="inline-block bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-sky-500 text-sm font-bold border border-white/50 shadow-sm">
                        @{profile.handle}
                    </span>

                    {profile.bio && (
                        <p className="mt-6 text-sky-700/80 leading-relaxed max-w-xs mx-auto text-lg font-medium">
                            {profile.bio}
                        </p>
                    )}
                </header>

                {/* Links or Store */}
                <div className="space-y-4">
                    {activeTab === 'store' ? (
                        <ProductGrid products={products} />
                    ) : (
                        links.map((link) => {
                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className="bg-white/60 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-white">
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
                                    className="group block bg-white border border-sky-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(186,230,253,0.3)] hover:shadow-[0_8px_20px_rgba(186,230,253,0.5)] hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                                                <Cloud className="w-5 h-5 fill-current" />
                                            </div>
                                            <span className="font-bold text-sky-900">{link.title}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-sky-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>

                {/* Blocks */}
                <div className="mt-12 space-y-8">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="bg-white/40 backdrop-blur-lg border border-white rounded-[2rem] p-6 shadow-sm">
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AirBioTemplate;
