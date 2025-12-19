import React, { useState } from 'react';
import { BioProfile, BioThemeConfig } from '../types';
import { Layout, Type, Palette as PaletteIcon, Shapes, Check, ChevronDown, Monitor, Image as ImageIcon, Sparkles, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { generateBackgroundImage } from '../services/geminiService';

interface BioAppearanceEditorProps {
    profile: BioProfile;
    onChange: (updates: Partial<BioProfile>) => void;
}

const FONTS = [
    { name: 'Inter', family: 'Inter', type: 'Sans Serif' },
    { name: 'Roboto', family: 'Roboto', type: 'Sans Serif' },
    { name: 'Playfair Display', family: 'Playfair Display', type: 'Serif' },
    { name: 'Space Mono', family: 'Space Mono', type: 'Monospace' },
    { name: 'Outfit', family: 'Outfit', type: 'Sans Serif' },
    { name: 'Dela Gothic One', family: '"Dela Gothic One"', type: 'Display' },
    { name: 'Bodoni Moda', family: '"Bodoni Moda"', type: 'Serif' },
];

const BUTTON_STYLES = [
    { id: 'rounded', name: 'Rounded', class: 'rounded-xl' },
    { id: 'pill', name: 'Pill', class: 'rounded-full' },
    { id: 'square', name: 'Square', class: 'rounded-none' },
    { id: 'hard-shadow', name: 'Hard Shadow', class: 'rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' },
    { id: 'wavy', name: 'Wavy', class: 'rounded-2xl' }, // Simplified for preview
];

const BioAppearanceEditor: React.FC<BioAppearanceEditorProps> = ({ profile, onChange }) => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [bgPrompt, setBgPrompt] = useState('');

    const isPro = ['pro', 'business', 'lifetime'].includes(user?.preferences?.subscription_tier || 'free');

    // Helper to get or init custom theme config
    const getConfig = (): BioThemeConfig => {
        return profile.customTheme || {
            backgroundType: 'solid',
            backgroundValue: '#ffffff',
            textColor: '#000000',
            buttonStyle: 'rounded',
            buttonColor: '#000000',
            buttonTextColor: '#ffffff',
            font: 'Inter'
        };
    };

    const config = getConfig();

    const updateConfig = (key: keyof BioThemeConfig, value: any) => {
        const newConfig = { ...config, [key]: value };
        onChange({ customTheme: newConfig, theme: 'custom' });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 1. Typography Section */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                        <Type className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Typography</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {FONTS.map((font) => (
                        <button
                            key={font.name}
                            onClick={() => updateConfig('font', font.family)}
                            className={`p-3 text-left rounded-xl border transition-all ${config.font === font.family
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20'
                                : 'border-stone-200 hover:border-indigo-300 hover:bg-stone-50'
                                }`}
                        >
                            <span className="block text-sm font-medium mb-1" style={{ fontFamily: font.family }}>{font.name}</span>
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">{font.type}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Colors & Background Section */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <div className="p-2 bg-pink-50 text-pink-500 rounded-lg">
                        <PaletteIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Colors</h3>
                </div>

                <div className="space-y-6">
                    {/* Background Settings */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Background</label>
                            <div className="flex bg-stone-100 p-1 rounded-lg">
                                <button
                                    onClick={() => updateConfig('backgroundType', 'solid')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${config.backgroundType === 'solid' ? 'bg-white shadow-sm text-slate-900' : 'text-stone-500 hover:text-slate-900'}`}
                                >
                                    Color
                                </button>
                                <button
                                    onClick={() => updateConfig('backgroundType', 'image')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${config.backgroundType === 'image' ? 'bg-white shadow-sm text-slate-900' : 'text-stone-500 hover:text-slate-900'}`}
                                >
                                    Image
                                </button>
                            </div>
                        </div>

                        {/* Solid Color Mode */}
                        {config.backgroundType === 'solid' && (
                            <div className="flex items-center gap-3 animate-fadeIn">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-black/10 shadow-sm">
                                    <input
                                        type="color"
                                        value={config.backgroundValue.startsWith('#') ? config.backgroundValue : '#ffffff'}
                                        onChange={(e) => updateConfig('backgroundValue', e.target.value)}
                                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={config.backgroundValue}
                                        onChange={(e) => updateConfig('backgroundValue', e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Image Mode */}
                        {config.backgroundType === 'image' && (
                            <div className="space-y-3 animate-fadeIn">
                                {/* Current Image Input */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center overflow-hidden">
                                        {config.backgroundValue.startsWith('http') ? (
                                            <img src={config.backgroundValue} alt="Bg" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-5 h-5 text-stone-400" />
                                        )}
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={config.backgroundValue}
                                        onChange={(e) => updateConfig('backgroundValue', e.target.value)}
                                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* AI Generator (Nano Banana) */}
                                <div className={`p-4 rounded-xl border ${isPro ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100' : 'bg-stone-50 border-stone-200 opacity-75'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-900">Generate with Nano Banana</span>
                                        </div>
                                        {!isPro && <Lock className="w-3 h-3 text-stone-400" />}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="E.g., minimal tropical sunset..."
                                            value={bgPrompt}
                                            onChange={(e) => setBgPrompt(e.target.value)}
                                            disabled={!isPro || isGenerating}
                                            className="flex-1 bg-white border border-stone-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-transparent"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!bgPrompt) return;
                                                setIsGenerating(true);
                                                try {
                                                    const url = await generateBackgroundImage(bgPrompt);
                                                    updateConfig('backgroundValue', url);
                                                } catch (e) {
                                                    console.error(e);
                                                    alert('Failed to generate image. Please try again.');
                                                } finally {
                                                    setIsGenerating(false);
                                                }
                                            }}
                                            disabled={!isPro || isGenerating || !bgPrompt}
                                            className="bg-indigo-600 text-white px-3 rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[32px] transition-colors"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                                        </button>
                                    </div>
                                    {!isPro && (
                                        <p className="text-[10px] text-stone-500 mt-2">
                                            Upgrade to Pro to generate unlimited AI backgrounds.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Text Color */}
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Text Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-black/10 shadow-sm">
                                <input
                                    type="color"
                                    value={config.textColor}
                                    onChange={(e) => updateConfig('textColor', e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={config.textColor}
                                    onChange={(e) => updateConfig('textColor', e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Button Styles */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                        <Shapes className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Buttons</h3>
                </div>

                <div className="space-y-6">
                    {/* Style Selector */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {BUTTON_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => updateConfig('buttonStyle', style.id)}
                                className={`
                                    h-12 flex items-center justify-center text-xs font-bold transition-all
                                    ${config.buttonStyle === style.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-2 ring-slate-900 ring-offset-2'
                                        : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                    }
                                    ${style.class}
                                `}
                            >
                                {style.name}
                            </button>
                        ))}
                    </div>

                    {/* Button Color */}
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Button Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-black/10 shadow-sm">
                                <input
                                    type="color"
                                    value={config.buttonColor}
                                    onChange={(e) => updateConfig('buttonColor', e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={config.buttonColor}
                                    onChange={(e) => updateConfig('buttonColor', e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Button Text Color */}
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Button Text</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-black/10 shadow-sm">
                                <input
                                    type="color"
                                    value={config.buttonTextColor}
                                    onChange={(e) => updateConfig('buttonTextColor', e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={config.buttonTextColor}
                                    onChange={(e) => updateConfig('buttonTextColor', e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Visibility Toggles (Legacy but useful) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                        <Monitor className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Visibility</h3>
                </div>

                <div className="space-y-4">
                    {/* Gallery Toggle */}
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                            <p className="font-bold text-sm text-slate-900">Gallery</p>
                            <p className="text-xs text-stone-500">Show photo gallery</p>
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
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                    </div>

                    {/* Newsletter Toggle */}
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                            <p className="font-bold text-sm text-slate-900">Newsletter</p>
                            <p className="text-xs text-stone-500">Show subscription form</p>
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
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                    </div>

                    {/* App Stack Toggle */}
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                            <p className="font-bold text-sm text-slate-900">App Stack</p>
                            <p className="text-xs text-stone-500">Show favorite apps</p>
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
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BioAppearanceEditor;
