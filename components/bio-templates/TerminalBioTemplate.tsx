import React, { useState, useEffect } from 'react';
import { BioProfile, LinkData, Product } from '../../types';
import { Terminal, ChevronRight, Hash } from 'lucide-react';
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

const TerminalBioTemplate: React.FC<BioTemplateProps> = ({ profile, links, products = [], activeTab = 'links' }) => {
    const [typedText, setTypedText] = useState('');
    const fullText = profile.displayName || 'User';

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < fullText.length) {
                setTypedText(fullText.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 100);
        return () => clearInterval(timer);
    }, [fullText]);

    return (
        <div className="min-h-screen bg-[#0C0C0C] text-[#00FF00] font-mono p-4 selection:bg-[#00FF00] selection:text-black">
            <div className="max-w-2xl mx-auto border border-[#333] rounded-lg bg-black shadow-2xl overflow-hidden min-h-[90vh]">

                {/* Title Bar */}
                <div className="bg-[#1a1a1a] border-b border-[#333] p-2 flex items-center gap-2">
                    <div className="flex gap-1.5 ml-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 text-center text-xs text-gray-500 font-sans">
                        guest@{profile.handle}:~
                    </div>
                </div>

                <div className="p-6">
                    {/* Prompt */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-xl mb-2">
                            <span className="text-blue-400">➜</span>
                            <span className="text-pink-400">whoami</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">
                            {typedText}<span className="animate-pulse">_</span>
                        </h1>
                        <p className="text-gray-500">@{profile.handle}</p>

                        {profile.bio && (
                            <div className="mt-4 p-4 border-l-2 border-dashed border-[#333] text-gray-400 text-sm">
                                <span className="text-[#00FF00] opacity-50">// Bio</span>
                                <br />
                                {profile.bio}
                            </div>
                        )}
                    </div>

                    {/* Links or Store */}
                    {activeTab === 'store' ? (
                        <div className="mb-12">
                            <div className="flex items-center gap-2 text-xl mb-4">
                                <span className="text-blue-400">➜</span>
                                <span className="text-pink-400">ls -la ./store</span>
                            </div>
                            <ProductGrid products={products} />
                        </div>
                    ) : (
                        <div className="space-y-4 mb-12">
                            <div className="flex items-center gap-2 text-xl mb-4">
                                <span className="text-blue-400">➜</span>
                                <span className="text-pink-400">ls -la ./links</span>
                            </div>

                            {links.map((link) => {
                                if (link.type !== 'link') {
                                    return (
                                        <div key={link.id} className="border border-[#333] bg-[#111] p-1">
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
                                        className="group block border-l-2 border-transparent hover:border-[#00FF00] pl-4 py-2 hover:bg-[#111] transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600 text-xs">drwxr-xr-x</span>
                                                <span className="font-bold underline decoration-dotted decoration-gray-600 group-hover:decoration-[#00FF00] underline-offset-4">
                                                    {link.title}
                                                </span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 text-xs text-[#00FF00] transition-opacity">
                                                ./EXECUTE &lt;CR&gt;
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                            <div className="text-gray-600 text-sm mt-2">
                                total {links.length}
                            </div>
                        </div>
                    )}

                    {/* System Info / Blocks */}
                    {(profile.blockVisibility?.techVault !== false || profile.blockVisibility?.appStack !== false) && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-xl mb-4">
                                <span className="text-blue-400">➜</span>
                                <span className="text-pink-400">neofetch --config custom</span>
                            </div>
                            <div className="border border-[#333] p-4 bg-[#0a0a0a] font-mono text-xs text-gray-400 leading-relaxed">
                                {profile.blockVisibility?.techVault !== false && (
                                    <TechVaultBlock userId={profile.userId} variant="default" />
                                )}
                                {profile.blockVisibility?.appStack !== false && (
                                    <div className="mt-4">
                                        <AppStackBlock userId={profile.userId} variant="default" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Blinking Bottom Cursor */}
                    <div className="flex items-center gap-2 text-lg animate-pulse mt-12">
                        <span className="text-blue-400">➜</span>
                        <span className="text-white">_</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TerminalBioTemplate;
