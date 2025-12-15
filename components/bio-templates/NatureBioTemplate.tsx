import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ArrowRight, Leaf, Flower2 } from 'lucide-react';
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

const NatureBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-[#F7F9F5] text-[#2C3E2D] font-sans selection:bg-[#D4E8D7] selection:text-[#1A2F1B] relative overflow-hidden p-6">

            {/* Organic Background Shapes */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#E8F3E9] rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#E2EDE3] rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

            <div className="max-w-lg mx-auto relative z-10">

                {/* Header */}
                <header className="text-center mb-10 pt-8">
                    <div className="inline-block relative mb-6">
                        <div className="w-28 h-28 rounded-[2rem] overflow-hidden shadow-sm border-4 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#E8F3E9] flex items-center justify-center text-[#4A674B]">
                                    <Leaf className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-sm text-[#4A674B]">
                            <Flower2 className="w-5 h-5" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-serif font-medium text-[#1A2F1B] mb-2">{profile.displayName}</h1>
                    <p className="text-[#6B8A6D] font-medium">@{profile.handle}</p>

                    {profile.bio && (
                        <div className="mt-4 inline-block bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50">
                            <p className="text-[#4A674B] leading-relaxed">
                                {profile.bio}
                            </p>
                        </div>
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
                                        <div key={link.id} className="bg-white/80 backdrop-blur-md border border-white rounded-[1.5rem] p-1 shadow-sm">
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
                                        className="group block bg-white border border-[#E8F3E9] rounded-[1.5rem] p-4 shadow-[0_2px_8px_rgba(44,62,45,0.04)] hover:shadow-[0_8px_16px_rgba(44,62,45,0.06)] hover:border-[#D4E8D7] hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#F7F9F5] flex items-center justify-center text-[#6B8A6D] group-hover:bg-[#E8F3E9] group-hover:text-[#4A674B] transition-colors">
                                                    <Leaf className="w-4 h-4 transform group-hover:rotate-12 transition-transform" />
                                                </div>
                                                <span className="font-semibold text-[#2C3E2D]">{link.title}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-[#8FA990] group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Blocks */}
                <div className="mt-8 space-y-6">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="bg-white/60 backdrop-blur-sm border border-white rounded-[2rem] p-6 shadow-sm">
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NatureBioTemplate;
