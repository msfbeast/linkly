import React, { useState } from 'react';
import { BioProfile } from '../types';
import { Globe, Search, ImageIcon, Twitter, Linkedin, Info, Layout, Upload, Loader2 } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { toast } from 'sonner';

interface BioSeoEditorProps {
    profile: BioProfile;
    onChange: (updates: Partial<BioProfile>) => void;
}

const BioSeoEditor: React.FC<BioSeoEditorProps> = ({ profile, onChange }) => {
    const [activePreview, setActivePreview] = useState<'google' | 'twitter' | 'linkedin'>('google');
    const [isUploading, setIsUploading] = useState(false);

    const seo = profile.seo || {};
    const title = seo.title || profile.displayName || 'My Profile';
    const description = seo.description || profile.bio || 'Check out my links!';
    const image = seo.ogImage || profile.avatarUrl || 'https://via.placeholder.com/1200x630?text=No+Image';
    const url = `linkly.ai/${profile.handle}`;

    const handleUpdate = (field: keyof typeof seo, value: string) => {
        onChange({
            seo: {
                ...seo,
                [field]: value
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Input Section */}
            <div className="space-y-6">
                <div>


                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                                Meta Title
                                <span className="ml-2 text-xs font-normal text-stone-400">({title.length}/60)</span>
                            </label>
                            <input
                                type="text"
                                className="w-full bg-stone-50 border border-stone-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                                placeholder="My Awesome Profile"
                                value={seo.title || ''}
                                onChange={(e) => handleUpdate('title', e.target.value)}
                                maxLength={60}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                                Meta Description
                                <span className="ml-2 text-xs font-normal text-stone-400">({description.length}/160)</span>
                            </label>
                            <textarea
                                rows={3}
                                className="w-full bg-stone-50 border border-stone-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium resize-none"
                                placeholder="A short description of who you are and what you do..."
                                value={seo.description || ''}
                                onChange={(e) => handleUpdate('description', e.target.value)}
                                maxLength={160}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                                Open Graph Image URL
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="url"
                                        className="w-full bg-stone-50 border border-stone-200 text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium pl-10"
                                        placeholder="https://..."
                                        value={seo.ogImage || ''}
                                        onChange={(e) => handleUpdate('ogImage', e.target.value)}
                                    />
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                </div>
                                <label className="flex items-center justify-center p-3 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors" title="Upload Image">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                setIsUploading(true);
                                                const url = await supabaseAdapter.uploadOgImage(file, profile.userId);
                                                handleUpdate('ogImage', url);
                                                toast.success('Image uploaded successfully');
                                            } catch (error) {
                                                console.error(error);
                                                toast.error('Failed to upload image');
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                    />
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5 text-stone-500" />
                                    )}
                                </label>
                            </div>
                            <p className="text-xs text-stone-400 mt-2">
                                Recommended size: 1200x630 pixels. Defaults to your avatar if left empty.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview Section */}
            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                        <Layout className="w-4 h-4" /> Live Preview
                    </h3>
                    <div className="flex bg-white rounded-lg p-1 border border-stone-200 shadow-sm">
                        <button
                            onClick={() => setActivePreview('google')}
                            className={`p-2 rounded-md transition-all ${activePreview === 'google' ? 'bg-indigo-50 text-indigo-600' : 'text-stone-400 hover:text-stone-600'}`}
                            title="Google Search"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setActivePreview('twitter')}
                            className={`p-2 rounded-md transition-all ${activePreview === 'twitter' ? 'bg-sky-50 text-sky-500' : 'text-stone-400 hover:text-stone-600'}`}
                            title="Twitter / X"
                        >
                            <Twitter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setActivePreview('linkedin')}
                            className={`p-2 rounded-md transition-all ${activePreview === 'linkedin' ? 'bg-blue-50 text-blue-600' : 'text-stone-400 hover:text-stone-600'}`}
                            title="LinkedIn"
                        >
                            <Linkedin className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-stone-200 shadow-sm p-4 overflow-hidden">

                    {/* Google Preview */}
                    {activePreview === 'google' && (
                        <div className="w-full max-w-[600px] font-arial cursor-pointer group">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-stone-100 rounded-full w-7 h-7 flex items-center justify-center overflow-hidden">
                                    {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <Globe className="w-4 h-4 text-stone-500" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-800 leading-none">Linkly</span>
                                    <span className="text-xs text-stone-500 leading-none mt-0.5">{url}</span>
                                </div>
                                <div className="ml-auto">
                                    <Info className="w-4 h-4 text-stone-400" />
                                </div>
                            </div>
                            <h3 className="text-xl text-[#1a0dab] group-hover:underline cursor-pointer mb-1 truncate font-medium">
                                {title}
                            </h3>
                            <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                                {description}
                            </p>
                        </div>
                    )}

                    {/* Twitter Card Preview (Summary with Large Image) */}
                    {activePreview === 'twitter' && (
                        <div className="w-full max-w-[500px] border border-stone-200 rounded-2xl overflow-hidden cursor-pointer hover:bg-stone-50 transition-colors">
                            <div className="relative aspect-[2/1] bg-stone-100 overflow-hidden">
                                {image !== 'https://via.placeholder.com/1200x630?text=No+Image' ? (
                                    <img src={image} className="w-full h-full object-cover" alt="OG" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium bg-stone-100">
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <span className="text-xs text-stone-500 uppercase font-medium mb-1 block">linkly.ai</span>
                                <p className="text-slate-900 font-medium leading-snug truncate mb-1">{title}</p>
                                <p className="text-stone-500 text-sm leading-snug line-clamp-2">{description}</p>
                            </div>
                        </div>
                    )}

                    {/* LinkedIn Preview */}
                    {activePreview === 'linkedin' && (
                        <div className="w-full max-w-[500px] bg-[#EEF3F8] p-4 rounded-lg">
                            <div className="bg-white border border-stone-300 rounded-md overflow-hidden cursor-pointer shadow-sm">
                                <div className="relative aspect-[1.91/1] bg-stone-200 overflow-hidden">
                                    <img src={image} className="w-full h-full object-cover" alt="OG" onError={(e) => e.currentTarget.src = `https://via.placeholder.com/1200x630?text=${encodeURIComponent(title)}`} />
                                </div>
                                <div className="p-2 bg-white">
                                    <h4 className="text-sm font-semibold text-slate-900 truncate">{title}</h4>
                                    <p className="text-xs text-stone-500 truncate mt-0.5">linkly.ai</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BioSeoEditor;
