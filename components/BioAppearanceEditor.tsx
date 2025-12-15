import React from 'react';
import { BioProfile } from '../types';
import { Layout } from 'lucide-react';

interface BioAppearanceEditorProps {
    profile: BioProfile;
    onChange: (updates: Partial<BioProfile>) => void;
}

const BioAppearanceEditor: React.FC<BioAppearanceEditorProps> = ({ profile, onChange }) => {
    return (
        <div className="space-y-6">
            {/* Content Blocks - Functional Settings */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-none">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                        <Layout className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Content Blocks</h3>
                </div>

                <div className="space-y-4">
                    {/* Gallery Toggle */}
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                        <div>
                            <p className="font-medium text-white">📸 Gallery</p>
                            <p className="text-xs text-stone-400">Show your photo gallery section</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.blockVisibility?.gallery !== false}
                                onChange={e => onChange({
                                    blockVisibility: {
                                        ...profile.blockVisibility,
                                        gallery: e.target.checked
                                    }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* Newsletter Toggle */}
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                        <div>
                            <p className="font-medium text-white">📧 Newsletter</p>
                            <p className="text-xs text-stone-400">Show email subscription form</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.blockVisibility?.newsletter !== false}
                                onChange={e => onChange({
                                    blockVisibility: {
                                        ...profile.blockVisibility,
                                        newsletter: e.target.checked
                                    }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {/* App Stack Toggle */}
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                        <div>
                            <p className="font-medium text-white">📱 App Stack</p>
                            <p className="text-xs text-stone-400">Show your favorite apps section</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={profile.blockVisibility?.appStack !== false}
                                onChange={e => onChange({
                                    blockVisibility: {
                                        ...profile.blockVisibility,
                                        appStack: e.target.checked
                                    }
                                })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BioAppearanceEditor;
