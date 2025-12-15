import React from 'react';
import { Sparkles, Palette, Zap, Layers, Box, Terminal, Type, Grid, Archive, Microscope, Clock, Hexagon, ChevronDown, LayoutGrid, Star, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeGalleryComponent } from './ThemeGalleryComponent';
import { BioThemeConfig } from '../types';

interface ThemeGalleryProps {
    currentTheme: string;
    onSelect: (theme: string) => void;
    onSelectCustom?: (config: BioThemeConfig) => void;
    currentCustomTheme?: BioThemeConfig;
}

interface ThemeDefinition {
    id: string;
    name: string;
    description: string;
    colors: string[];
    icon: React.ElementType;
    isPremium?: boolean;
}

// Helper icon
const Music = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
);

const THEMES: ThemeDefinition[] = [
    {
        id: 'bento',
        name: 'Bento Grid',
        description: 'Modern masonry layout',
        colors: ['#F9FAFB', '#111827', '#E5E7EB'],
        icon: LayoutGrid,
        isPremium: true
    },
    {
        id: 'neopop',
        name: 'Neo Pop',
        description: 'Vibrant & fun',
        colors: ['#FEF08A', '#F472B6', '#000000'],
        icon: Star,
        isPremium: true
    },
    {
        id: 'editorial',
        name: 'Editorial',
        description: 'Magazine aesthetic',
        colors: ['#1C1917', '#FFFFFF', '#D6D3D1'],
        icon: Newspaper,
        isPremium: true
    },
    {
        id: 'vibrant',
        name: 'Vibrant',
        description: 'High energy pop colors',
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77'],
        icon: Zap
    },
    {
        id: 'glass',
        name: 'Glass',
        description: 'Modern frosted glass effect',
        colors: ['#2D3436', '#636E72', '#B2BEC3'],
        icon: Layers
    },
    {
        id: 'bauhaus',
        name: 'Bauhaus',
        description: 'Geometric & bold',
        colors: ['#D12A2A', '#2A5AD1', '#E6B800'],
        icon: Hexagon
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Neon future aesthetic',
        colors: ['#00FF41', '#FF003C', '#050505'],
        icon: Terminal
    },
    {
        id: 'retro',
        name: 'Retro Pop',
        description: 'Nostalgic 90s vibes',
        colors: ['#FF6AD5', '#C774E8', '#94D0FF'],
        icon: Clock
    },
    {
        id: 'neubrutalism',
        name: 'Neubrutalism',
        description: 'Bold borders & contrast',
        colors: ['#1A1A1A', '#FFFFFF', '#A3E635'],
        icon: Box
    },
    {
        id: 'lofi',
        name: 'Lofi',
        description: 'Chill & relaxed tones',
        colors: ['#E0C3FC', '#8EC5FC', '#FFFFFF'],
        icon: Music
    },
    {
        id: 'clay',
        name: 'Claymorphism',
        description: 'Soft 3D floating elements',
        colors: ['#FF8993', '#FFC75F', '#F9F8FD'],
        icon: Palette
    },
    {
        id: 'industrial',
        name: 'Industrial',
        description: 'Raw technical look',
        colors: ['#2F3542', '#57606F', '#CED6E0'],
        icon: Grid
    },
    {
        id: 'lab',
        name: 'The Lab',
        description: 'Scientific precision',
        colors: ['#0984E3', '#74B9FF', '#FFFFFF'],
        icon: Microscope
    },
    {
        id: 'archive',
        name: 'Archive',
        description: 'Minimal document style',
        colors: ['#F1F2F6', '#2F3542', '#A4B0BE'],
        icon: Archive
    },
];




export const ThemeGallery: React.FC<ThemeGalleryProps> = ({ currentTheme, onSelect, onSelectCustom, currentCustomTheme }) => {
    return (
        <div className="space-y-8">
            {/* Premium Themes (Deep Customization) - Main View */}
            {onSelectCustom && (
                <div className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-6 px-1">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-bold text-white">Featured Themes</h3>
                        <span className="text-xs text-stone-400 font-medium ml-auto">Scroll for more →</span>
                    </div>
                    <ThemeGalleryComponent
                        currentTheme={currentCustomTheme}
                        onSelect={onSelectCustom}
                    />
                </div>
            )}

            {/* Legacy / Standard Themes - Hidden by default */}
            <details className="group border-t border-white/10 pt-6">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-stone-400 hover:text-white transition-colors py-2 selection:bg-none">
                    <div className="p-1 rounded bg-white/5 group-hover:bg-white/10 transition-colors">
                        <Palette className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">Create Custom Theme / Classic Presets</span>
                    <div className="ml-auto transform group-open:rotate-180 transition-transform">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </summary>

                <div className="mt-6 animate-slideDown">
                    <div className="flex items-center gap-2 mb-4">
                        <Grid className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Standard Presets</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {THEMES.map((theme) => {
                            const isActive = currentTheme === theme.id && !currentCustomTheme;
                            const Icon = theme.icon;

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => onSelect(theme.id)}
                                    className={`
                                        relative group flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left
                                        ${isActive
                                            ? 'border-amber-500 bg-amber-50 shadow-md ring-1 ring-amber-500/20'
                                            : 'border-stone-100 bg-white hover:border-amber-200 hover:shadow-sm'
                                        }
    `}
                                >
                                    {/* Header: Icon and Name */}
                                    <div className="flex items-center gap-3 mb-2 w-full">
                                        <div className={`
    p-2 rounded-lg transition-colors
    ${isActive ? 'bg-amber-100/50 text-amber-600' : 'bg-stone-50 text-stone-400 group-hover:text-amber-500 group-hover:bg-amber-50'}
    `}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold text-sm truncate ${isActive ? 'text-amber-900' : 'text-slate-900'}`}>{theme.name}</h4>
                                        </div>
                                        {isActive && (
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-stone-500 mb-3 line-clamp-1">{theme.description}</p>

                                    {/* Color Swatches */}
                                    <div className="flex gap-1 mt-auto">
                                        {theme.colors.map((color, idx) => (
                                            <div
                                                key={idx}
                                                className="w-4 h-4 rounded-full ring-1 ring-black/5 shadow-sm"
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </details>
        </div>
    );
};
