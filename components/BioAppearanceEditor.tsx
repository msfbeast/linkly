import React, { useState, useEffect } from 'react';
import { BioProfile, BioThemeConfig } from '../types';
import { Palette, Type, Layout, Image as ImageIcon, Check, Sparkles, Loader2, Wand2, ChevronDown } from 'lucide-react';
import { generateBackgroundImage } from '../services/geminiService';

interface BioAppearanceEditorProps {
    profile: BioProfile;
    onChange: (updates: Partial<BioProfile>) => void;
}

const DEFAULT_THEME: BioThemeConfig = {
    backgroundType: 'solid',
    backgroundValue: '#ffffff',
    textColor: '#000000',
    buttonStyle: 'rounded',
    buttonColor: '#000000',
    buttonTextColor: '#ffffff',
    font: 'inter'
};

const FONTS = [
    { id: 'inter', name: 'Inter (Modern)' },
    { id: 'roboto', name: 'Roboto (Clean)' },
    { id: 'lora', name: 'Lora (Serif)' },
    { id: 'poppins', name: 'Poppins (Geometric)' },
    { id: 'space-mono', name: 'Space Mono (Tech)' },
    { id: 'outfit', name: 'Outfit (Bold)' },
];

const BUTTON_STYLES = [
    { id: 'rounded', name: 'Rounded', class: 'rounded-lg' },
    { id: 'pill', name: 'Pill', class: 'rounded-full' },
    { id: 'square', name: 'Square', class: 'rounded-none' },
    { id: 'shadow', name: 'Soft Shadow', class: 'rounded-lg shadow-lg' },
    { id: 'hard-shadow', name: 'Hard Shadow', class: 'rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' },
    { id: 'outline', name: 'Outline', class: 'rounded-lg border-2 bg-transparent' },
];

const GRADIENTS = [
    'linear-gradient(to right, #ff7e5f, #feb47b)',
    'linear-gradient(to right, #8360c3, #2ebf91)',
    'linear-gradient(to right, #00c6ff, #0072ff)',
    'linear-gradient(to right, #f12711, #f5af19)',
    'linear-gradient(to right, #11998e, #38ef7d)',
    'linear-gradient(to right, #fc466b, #3f5efb)',
];

useEffect(() => {
    // Sync local state if profile changes externally (e.g. from ThemeGallery)
    if (profile.customTheme) {
        setTheme(profile.customTheme);
    }
}, [profile.customTheme]);

const handleGenerateBackground = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
        const url = await generateBackgroundImage(aiPrompt);
        updateTheme('backgroundType', 'image');
        updateTheme('backgroundValue', url);
        setShowAiPrompt(false);
        setAiPrompt('');
    } catch (error) {
        console.error(error);
        alert("Failed to generate background. Please try again.");
    } finally {
        setIsGenerating(false);
    }
};

const updateTheme = (key: keyof BioThemeConfig, value: any) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    onChange({ customTheme: newTheme });
};

return (
    <div className="space-y-6">
        {/* Content Blocks - Functional Settings */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-50 rounded-lg text-green-500">
                    <Layout className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Content Blocks</h3>
            </div>

            <div className="space-y-4">
                {/* Gallery Toggle */}
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                        <p className="font-medium text-slate-900">📸 Gallery</p>
                        <p className="text-xs text-stone-500">Show your photo gallery section</p>
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
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>

                {/* Newsletter Toggle */}
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                        <p className="font-medium text-slate-900">📧 Newsletter</p>
                        <p className="text-xs text-stone-500">Show email subscription form</p>
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
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>

                {/* App Stack Toggle */}
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                        <p className="font-medium text-slate-900">📱 App Stack</p>
                        <p className="text-xs text-stone-500">Show your favorite apps section</p>
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
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
            </div>
        </div>

        {/* Advanced Styling (Collapsible) */}
        <details className="group border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors select-none">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-500">
                    <Wand2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-slate-900 font-bold">Advanced Styling</h3>
                    <p className="text-xs text-stone-500">Manually tweak colors, fonts, and buttons</p>
                </div>
                <div className="ml-auto transform group-open:rotate-180 transition-transform text-stone-400">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </summary>

            <div className="p-6 space-y-8 border-t border-stone-100 animate-slideDown">
                {/* Background Section */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Background</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Type Selector */}
                        <div className="flex bg-stone-100 p-1 rounded-lg">
                            {(['solid', 'gradient', 'image'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateTheme('backgroundType', type)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${theme.backgroundType === type
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-stone-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Value Input */}
                        <div>
                            {theme.backgroundType === 'solid' && (
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={theme.backgroundValue}
                                        onChange={e => updateTheme('backgroundValue', e.target.value)}
                                        className="w-12 h-12 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <div className="flex-1">
                                        <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1 block">Color Code</label>
                                        <input
                                            type="text"
                                            value={theme.backgroundValue}
                                            onChange={e => updateTheme('backgroundValue', e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {theme.backgroundType === 'gradient' && (
                                <div className="grid grid-cols-3 gap-3">
                                    {GRADIENTS.map((grad, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => updateTheme('backgroundValue', grad)}
                                            className={`h-16 rounded-lg transition-all ${theme.backgroundValue === grad ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
                                            style={{ background: grad }}
                                        />
                                    ))}
                                </div>
                            )}

                            {theme.backgroundType === 'image' && (
                                <div>
                                    <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Image URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={theme.backgroundValue}
                                        onChange={e => updateTheme('backgroundValue', e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm"
                                    />
                                    <p className="text-xs text-stone-400 mt-2">Use Unsplash or direct image links.</p>

                                    <div className="mt-4">
                                        {!showAiPrompt ? (
                                            <button
                                                onClick={() => setShowAiPrompt(true)}
                                                className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-xl transition-colors w-full justify-center border border-amber-100"
                                            >
                                                <Wand2 className="w-4 h-4" />
                                                Generate with AI (Nano Banana)
                                            </button>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl animate-fadeIn">
                                                <label className="text-xs font-bold uppercase text-amber-900 mb-2 block">AI Prompt</label>
                                                <textarea
                                                    value={aiPrompt}
                                                    onChange={(e) => setAiPrompt(e.target.value)}
                                                    placeholder="E.g., Cyberpunk city, neon lights, dark mode..."
                                                    className="w-full bg-white border border-amber-200 text-slate-900 p-3 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleGenerateBackground}
                                                        disabled={isGenerating || !aiPrompt.trim()}
                                                        className="flex-1 bg-amber-500 text-black font-bold py-2 rounded-lg text-sm hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                        {isGenerating ? 'Generating...' : 'Generate'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAiPrompt(false)}
                                                        className="px-3 py-2 text-stone-500 hover:text-stone-700 font-medium text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons Section */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                            <Layout className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Buttons</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {BUTTON_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => updateTheme('buttonStyle', style.id)}
                                    className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${theme.buttonStyle === style.id
                                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                                        }`}
                                >
                                    <div className={`w-full h-8 bg-current opacity-20 ${style.class}`} />
                                    <span className="text-xs font-medium">{style.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Button Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={theme.buttonColor}
                                        onChange={e => updateTheme('buttonColor', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={theme.buttonColor}
                                        onChange={e => updateTheme('buttonColor', e.target.value)}
                                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={theme.buttonTextColor}
                                        onChange={e => updateTheme('buttonTextColor', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={theme.buttonTextColor}
                                        onChange={e => updateTheme('buttonTextColor', e.target.value)}
                                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Typography Section */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
                            <Type className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Typography</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Font Family</label>
                            <select
                                value={theme.font}
                                onChange={e => updateTheme('font', e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            >
                                {FONTS.map(font => (
                                    <option key={font.id} value={font.id}>{font.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Page Text Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={theme.textColor}
                                    onChange={e => updateTheme('textColor', e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={theme.textColor}
                                    onChange={e => updateTheme('textColor', e.target.value)}
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </details>
    </div>
);
};

export default BioAppearanceEditor;
