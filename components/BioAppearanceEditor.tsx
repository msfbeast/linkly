import React, { useState, useEffect } from 'react';
import { BioProfile, BioThemeConfig } from '../types';
import { Palette, Type, Layout, Image as ImageIcon, Check } from 'lucide-react';

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

const BioAppearanceEditor: React.FC<BioAppearanceEditorProps> = ({ profile, onChange }) => {
    const [isEnabled, setIsEnabled] = useState(!!profile.customTheme);
    const [theme, setTheme] = useState<BioThemeConfig>(profile.customTheme || DEFAULT_THEME);

    useEffect(() => {
        if (isEnabled) {
            onChange({ customTheme: theme });
        } else {
            onChange({ customTheme: undefined });
        }
    }, [isEnabled, theme]);

    const updateTheme = (key: keyof BioThemeConfig, value: any) => {
        setTheme(prev => ({ ...prev, [key]: value }));
    };

    if (!isEnabled) {
        return (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Appearance</h3>
                <p className="text-stone-500 mb-6 max-w-md mx-auto">
                    Enable custom appearance to override the preset theme with your own colors, fonts, and styles.
                </p>
                <button
                    onClick={() => setIsEnabled(true)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                    Enable Customization
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <Check className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">Custom Appearance Active</p>
                        <p className="text-xs text-amber-700">Preset theme selection is currently overridden.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEnabled(false)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                >
                    Disable & Revert
                </button>
            </div>

            {/* Background Section */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Buttons Section */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                        <Layout className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Buttons</h3>
                </div>

                <div className="space-y-6">
                    {/* Style Grid */}
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

                    {/* Button Colors */}
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
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
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

            {/* Block Visibility Section */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-lg text-green-500">
                        <Layout className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Content Blocks</h3>
                </div>

                <p className="text-sm text-stone-500 mb-4">Choose which blocks to show on your bio page.</p>

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

        </div>
    );
};

export default BioAppearanceEditor;
