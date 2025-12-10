import React, { useRef } from 'react';
import { PRESET_THEMES, ThemePreset } from './ThemeGalleryConfig';
import { BioThemeConfig } from '../types';
import { Check, Palette, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThemeGalleryComponentProps {
    currentTheme?: BioThemeConfig;
    onSelect: (config: BioThemeConfig) => void;
}

export const ThemeGalleryComponent: React.FC<ThemeGalleryComponentProps> = ({ currentTheme, onSelect }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Helper to render a mini button preview based on style
    const renderMiniButton = (config: BioThemeConfig) => {
        const baseClass = "w-full h-8 mb-3 flex items-center justify-center text-[6px] font-bold opacity-80";
        const style: React.CSSProperties = {
            backgroundColor: config.buttonColor,
            color: config.buttonTextColor,
            fontFamily: config.font || 'inherit'
        };

        // Match main logic roughly
        let shapeClass = "rounded-md";
        if (config.buttonStyle === 'pill') shapeClass = "rounded-full";
        if (config.buttonStyle === 'square') shapeClass = "rounded-none";
        if (config.buttonStyle === 'hard-shadow') shapeClass = "rounded-md border border-current shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
        if (config.buttonStyle === 'wavy') shapeClass = "rounded-[10px_2px_10px_2px] border border-current shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]";
        if (config.buttonStyle === 'outline') {
            style.backgroundColor = 'transparent';
            style.border = `1px solid ${config.buttonTextColor}`;
        }

        return (
            <div className={`${baseClass} ${shapeClass}`} style={style}>
                Link
            </div>
        );
    };

    return (
        <div className="relative group/carousel">
            {/* Navigation Overlay */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 backdrop-blur shadow-lg rounded-full -ml-2 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 disabled:opacity-0"
            >
                <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 backdrop-blur shadow-lg rounded-full -mr-2 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110"
            >
                <ChevronRight className="w-5 h-5 text-white" />
            </button>


            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-6 p-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-8"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {PRESET_THEMES.map((preset) => {
                    // Match based on a deep comparison or just ID if we persisted ID. 
                    // Since we don't persist ID, we just check properties roughly or just let user pick.
                    // For highlighting, we can try matching colors.
                    const isSelected = currentTheme &&
                        currentTheme.backgroundValue === preset.config.backgroundValue &&
                        currentTheme.buttonStyle === preset.config.buttonStyle;

                    return (
                        <div key={preset.id} className="snap-center flex flex-col items-center gap-3">
                            <button
                                onClick={() => onSelect(preset.config)}
                                className={`
                                    relative w-[180px] h-[320px] rounded-[2.5rem] border-[6px] transition-all duration-300 overflow-hidden flex-shrink-0 shadow-xl group
                                    ${isSelected ? 'border-indigo-500 scale-105 ring-4 ring-indigo-500/20' : 'border-stone-800 hover:border-stone-600 hover:scale-102'}
                                `}
                            >
                                {/* Phone Mockup Inner */}
                                <div
                                    className="w-full h-full flex flex-col items-center pt-8 px-4"
                                    style={{
                                        background: preset.config.backgroundType === 'image'
                                            ? `url(${preset.config.backgroundValue}) center/cover no-repeat`
                                            : preset.config.backgroundValue || preset.config.backgroundValue
                                    }}
                                >

                                    {/* Mini Profile */}
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3 border border-white/30 shrink-0" />
                                    <div className="w-24 h-3 rounded-full bg-current opacity-50 mb-6 shrink-0" style={{ color: preset.config.textColor }} />

                                    {/* Mini Buttons */}
                                    <div className="w-full space-y-2">
                                        {renderMiniButton(preset.config)}
                                        {renderMiniButton(preset.config)}
                                        {renderMiniButton(preset.config)}
                                    </div>

                                    {/* Selection Overlay */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                            <div className="bg-white text-stone-900 rounded-full p-2 shadow-lg scale-110">
                                                <Check className="w-6 h-6" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover overlay name */}
                                    {!isSelected && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <p className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform">Preview</p>
                                        </div>
                                    )}
                                </div>
                            </button>
                            <span className={`text-sm font-medium ${isSelected ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                                {preset.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};
