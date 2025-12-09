import React from 'react';
import { PRESET_THEMES, ThemePreset } from './ThemeGalleryConfig';
import { BioThemeConfig } from '../types';
import { Check, Palette } from 'lucide-react';

interface ThemeGalleryComponentProps {
    currentTheme?: BioThemeConfig;
    onSelect: (config: BioThemeConfig) => void;
}

export const ThemeGalleryComponent: React.FC<ThemeGalleryComponentProps> = ({ currentTheme, onSelect }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Premium Themes</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PRESET_THEMES.map((preset) => {
                    const isSelected = JSON.stringify(currentTheme) === JSON.stringify(preset.config);

                    return (
                        <button
                            key={preset.id}
                            onClick={() => onSelect(preset.config)}
                            className={`
                                group relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all
                                ${isSelected ? 'border-indigo-500 scale-105 ring-2 ring-indigo-500/50' : 'border-stone-800 hover:border-stone-600 hover:scale-102'}
                            `}
                        >
                            {/* Preview Background */}
                            <div
                                className="absolute inset-0 z-0"
                                style={{
                                    background: preset.config.backgroundType === 'image'
                                        ? `url(${preset.config.backgroundValue}) center/cover`
                                        : preset.config.backgroundValue,
                                    // If gradient, we need correct syntax. Handled by style prop directly if valid string.
                                }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />

                            {/* Content Preview */}
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur mb-3" />
                                <div className="w-full h-8 rounded-lg bg-white/20 backdrop-blur mb-2" />
                                <div className="w-full h-8 rounded-lg bg-white/20 backdrop-blur" />

                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md text-white z-30">
                                <p className="text-xs font-bold text-center">{preset.name}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
