import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ArrowRight, Globe, Instagram, Twitter } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { GalleryBlock } from '../blocks/GalleryBlock';
import { ProductGrid } from './ProductGrid';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
    products?: Product[];
    activeTab?: 'links' | 'store';
}

const EditorialBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1c1917] font-serif selection:bg-[#1c1917] selection:text-[#FDFBF7]">

            {/* Split Layout for Desktop */}
            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* Left: Profile / Hero (Sticky on Desktop) */}
                <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 relative overflow-hidden bg-stone-200">
                    {profile.avatarUrl ? (
                        <>
                            <img
                                src={profile.avatarUrl}
                                alt={profile.displayName}
                                className="w-full h-[60vh] lg:h-full object-cover filter grayscale contrast-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/80 to-transparent lg:hidden"></div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1c1917] text-white">
                            <h1 className="text-9xl font-serif italic opacity-20">{profile.displayName.charAt(0)}</h1>
                        </div>
                    )}

                    {/* Floating Title for Mobile */}
                    <div className="absolute bottom-0 left-0 p-8 z-20 lg:hidden text-[#FDFBF7]">
                        <h1 className="text-6xl font-serif italic tracking-tighter leading-none mb-2">{profile.displayName}</h1>
                        <p className="font-sans text-sm tracking-[0.2em] uppercase opacity-80">@{profile.handle}</p>
                    </div>
                </div>

                {/* Right: Content Scroll */}
                <div className="flex-1 lg:h-screen lg:overflow-y-auto bg-[#FDFBF7]">
                    <div className="max-w-xl mx-auto px-6 py-12 lg:py-24">

                        {/* Desktop Header */}
                        <div className="hidden lg:block mb-16 border-b border-[#1c1917]/10 pb-12">
                            <h1 className="text-7xl font-serif italic tracking-tighter leading-none mb-4">{profile.displayName}</h1>
                            <div className="flex justify-between items-end">
                                <p className="font-sans text-sm tracking-[0.2em] uppercase text-stone-500">@{profile.handle}</p>
                                <p className="font-serif text-xl italic max-w-sm text-right leading-relaxed text-stone-600">
                                    "{profile.bio}"
                                </p>
                            </div>
                        </div>

                        {/* Mobile Bio Text */}
                        <div className="lg:hidden mb-12 mt-4 text-center">
                            <p className="font-serif text-xl italic leading-relaxed text-stone-800">
                                {profile.bio}
                            </p>
                        </div>

                        {/* Links or Store */}
                        <div className="space-y-8">
                            {activeTab === 'store' ? (
                                <div className="py-8">
                                    <h3 className="text-sm font-sans uppercase tracking-[0.2em] mb-8 text-center text-stone-400">The Collection</h3>
                                    <ProductGrid products={products} />
                                </div>
                            ) : (
                                links.map((link, i) => {
                                    if (link.type !== 'link') {
                                        return (
                                            <div key={link.id} className="border-b border-[#1c1917] pb-8">
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
                                            className="group block border-b border-[#1c1917] pb-6 hover:pl-4 transition-all duration-500"
                                        >
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-3xl lg:text-4xl font-serif group-hover:italic transition-all">
                                                    {link.title}
                                                </span>
                                                <span className="text-xs font-sans uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Visit <ArrowRight className="inline w-3 h-3 ml-1" />
                                                </span>
                                            </div>
                                            <div className="text-xs font-sans text-stone-400 uppercase tracking-wider flex items-center justify-between">
                                                <span>0{i + 1}</span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                                    {link.originalUrl?.replace(/^https?:\/\//, '').split('/')[0]}
                                                </span>
                                            </div>
                                        </a>
                                    );
                                })
                            )}
                        </div>

                        {/* Gallery Section */}
                        {(profile.blockVisibility?.gallery !== false) && (
                            <div className="mt-20 pt-12 border-t border-[#1c1917]/10">
                                <h3 className="text-sm font-sans uppercase tracking-[0.2em] mb-8 text-center text-stone-400">Selected Works</h3>
                                <GalleryBlock userId={profile.userId} />
                            </div>
                        )}

                        <div className="mt-24 text-center text-xs font-sans uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity">
                            Editorially Curated by Linkly
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorialBioTemplate;
