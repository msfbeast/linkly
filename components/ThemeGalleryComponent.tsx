import React from 'react';
import { PRESET_THEMES, ThemePreset } from './ThemeGalleryConfig';
import { BioThemeConfig } from '../types';
import { Check, Palette } from 'lucide-react';

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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur shadow-lg rounded-full -ml-2 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 disabled:opacity-0"
            >
                <ChevronLeft className="w-5 h-5 text-stone-800" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur shadow-lg rounded-full -mr-2 opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110"
            >
                <ChevronRight className="w-5 h-5 text-stone-800" />
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
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />

                            {/* Content Preview */ }
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

                    {/* Label */ }
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md text-white z-30">
                        <p className="text-xs font-bold text-center">{preset.name}</p>
                    </div>
                        </button>
            );
                })}
        </div>
        </div >
    );
};
