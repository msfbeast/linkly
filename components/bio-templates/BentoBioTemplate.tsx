import React from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { ArrowUpRight, Github, Twitter, Instagram, Linkedin, Mail, MapPin } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';
import { GalleryBlock } from '../blocks/GalleryBlock';
import { ProductGrid } from './ProductGrid';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
    products?: Product[];
    activeTab?: 'links' | 'store';
}

const BentoBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    return (
        <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* Profile Card (Large - Spans 2 cols on Desktop) */}
                    <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-stone-200 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-32 h-32 bg-slate-900 rounded-full blur-3xl"></div>
                        </div>

                        <div>
                            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-md">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                                        {profile.displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{profile.displayName}</h1>
                            <p className="text-stone-500 font-medium text-lg">@{profile.handle}</p>
                        </div>

                        {profile.bio && (
                            <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <p className="text-stone-600 leading-relaxed font-medium">
                                    {profile.bio}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Social/Status Card */}
                    <div className="md:col-span-1 bg-slate-900 text-white rounded-[2rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-30"></div>
                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/5">
                                Availability
                            </span>
                            <h3 className="text-2xl font-bold leading-tight mb-2">Open for new opportunities</h3>
                        </div>
                        <button className="relative z-10 mt-6 w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-stone-100 transition-colors flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            Contact Me
                        </button>
                    </div>

                    {/* Main Content Area (Links or Store) */}
                    <div className="md:col-span-3">
                        {activeTab === 'store' ? (
                            <ProductGrid products={products} />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {links.map((link) => {
                                    // Determine if link should be wide based on importance or config
                                    const isWide = link.layoutConfig?.w === 2;
                                    const colSpan = isWide ? 'md:col-span-2' : 'md:col-span-1 lg:col-span-2'; // Default to 2 cols on large grid for readability

                                    if (link.type !== 'link') {
                                        return (
                                            <div key={link.id} className={`${colSpan} bg-white rounded-[1.5rem] border border-stone-200 p-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
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
                                            className={`${colSpan} group bg-white hover:bg-stone-50 rounded-[1.5rem] border border-stone-200 p-6 flex flex-col justify-between transition-all hover:scale-[1.01] hover:border-stone-300 shadow-sm`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-stone-100 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    {/* Icon Logic placeholder - would normally map url to icon */}
                                                    <ArrowUpRight className="w-6 h-6 text-slate-900" />
                                                </div>
                                                <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{link.title}</h3>
                                                <p className="text-sm text-stone-500 line-clamp-1">
                                                    {link.originalUrl?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                                </p>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Content Blocks */}
                    {/* Dynamic Grid placement for blocks */}
                    <div className="md:col-span-3 space-y-4">
                        {/* Tech Vault - auto-hides when empty */}
                        {(profile.blockVisibility?.techVault !== false) && (
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        )}

                        {/* Gallery - auto-hides when empty */}
                        {(profile.blockVisibility?.gallery !== false) && (
                            <GalleryBlock userId={profile.userId} />
                        )}

                        {/* App Stack - auto-hides when empty */}
                        {(profile.blockVisibility?.appStack !== false) && (
                            <AppStackBlock userId={profile.userId} variant="default" />
                        )}
                    </div>

                    <div className="md:col-span-3 text-center py-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-slate-900 transition-colors cursor-pointer">
                            Powered by Gather
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BentoBioTemplate;
