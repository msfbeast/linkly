import React from 'react';
import { Sparkles, Palette, Zap, Layers, Box, Terminal, Type, Grid, Archive, Microscope, Clock, Hexagon, ChevronDown, LayoutGrid, Star, Newspaper, Moon, Leaf, Aperture, Cpu, StickyNote, Gem, Gamepad2, Cloud, FileBox } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeGalleryComponent } from './ThemeGalleryComponent';
import { BioThemeConfig } from '../types';
import BioPreview from './BioPreview';

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
        id: 'vibrant',
        name: 'Vibrant',
        description: 'Colorful & energetic',
        colors: ['#8B5CF6', '#F472B6', '#F59E0B'],
        icon: Zap,
        isPremium: false
    },
    {
        id: 'glass',
        name: 'Glassmorphism',
        description: 'Modern frosted glass',
        colors: ['#FFFFFF', '#E2E8F0', '#94A3B8'],
        icon: Layers,
        isPremium: false
    },
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
        id: 'swiss',
        name: 'Swiss',
        description: 'Clean typographic grid',
        colors: ['#EF4444', '#FFFFFF', '#000000'],
        icon: Type,
        isPremium: true
    },
    {
        id: 'midnight',
        name: 'Midnight',
        description: 'Deep OLED black',
        colors: ['#000000', '#1C1917', '#FFFFFF'],
        icon: Moon,
        isPremium: true
    },
    {
        id: 'nature',
        name: 'Nature',
        description: 'Organic greens & soft shapes',
        colors: ['#ECFCCB', '#365314', '#14532D'],
        icon: Leaf,
        isPremium: true
    },
    {
        id: 'aura',
        name: 'Aura',
        description: 'Ethereal moving gradients',
        colors: ['#C4B5FD', '#FBCFE8', '#67E8F9'],
        icon: Aperture,
        isPremium: true
    },
    {
        id: 'pixel',
        name: 'Pixel',
        description: 'Retro 8-bit style',
        colors: ['#3B82F6', '#EF4444', '#FCD34D'],
        icon: Cpu,
        isPremium: true
    },
    {
        id: 'terminal',
        name: 'Terminal',
        description: 'Hacker CLI aesthetics',
        colors: ['#000000', '#22C55E', '#00420C'],
        icon: Terminal,
        isPremium: true
    },
    {
        id: 'paper',
        name: 'Paper',
        description: 'Hand-drawn sketchbook',
        colors: ['#F5F5F4', '#292524', '#78716C'],
        icon: StickyNote,
        isPremium: true
    },
    {
        id: 'luxury',
        name: 'Luxury',
        description: 'Premium gold & serif',
        colors: ['#000000', '#D4AF37', '#171717'],
        icon: Gem,
        isPremium: true
    },
    {
        id: 'gamer',
        name: 'Gamer',
        description: 'RGB & Sharp Angles',
        colors: ['#000000', '#FF0055', '#00FF99'],
        icon: Gamepad2,
        isPremium: true
    },
    {
        id: 'air',
        name: 'Air',
        description: 'Light, breezy & cloudy',
        colors: ['#E0F2FE', '#FFFFFF', '#38BDF8'],
        icon: Cloud,
        isPremium: true
    },
    {
        id: 'neubrutalism',
        name: 'Neubrutalism',
        description: 'Bold borders & shadows',
        colors: ['#FEF08A', '#000000', '#FFFFFF'],
        icon: Box,
        isPremium: false
    },
    {
        id: 'retro',
        name: 'Retro Pop',
        description: '90s nostalgia',
        colors: ['#FEF3C7', '#F87171', '#60A5FA'],
        icon: Star,
        isPremium: false
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Neon & glitch',
        colors: ['#000000', '#F472B6', '#2DD4BF'],
        icon: Zap,
        isPremium: false
    },
    {
        id: 'lofi',
        name: 'Lofi',
        description: 'Chill & relaxed',
        colors: ['#F5F5F4', '#78716C', '#D6D3D1'],
        icon: Music,
        isPremium: false
    },
    {
        id: 'clay',
        name: 'Clay',
        description: 'Soft 3D pneumatic',
        colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC'],
        icon: Cloud,
        isPremium: false
    },
    {
        id: 'bauhaus',
        name: 'Bauhaus',
        description: 'Geometric minimalism',
        colors: ['#FCA5A5', '#FCD34D', '#93C5FD'],
        icon: Grid,
        isPremium: false
    },
    {
        id: 'industrial',
        name: 'Industrial',
        description: 'Raw materials',
        colors: ['#4B5563', '#9CA3AF', '#E5E7EB'],
        icon: Archive,
        isPremium: false
    },
    {
        id: 'lab',
        name: 'The Lab',
        description: 'Scientific precision',
        colors: ['#FFFFFF', '#E0F2FE', '#0EA5E9'],
        icon: Microscope,
        isPremium: false
    },
    {
        id: 'archive',
        name: 'Archive',
        description: 'Digital preservation',
        colors: ['#FDF6E3', '#002B36', '#B58900'],
        icon: FileBox,
        isPremium: false
    }
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

            {/* Premium Themes Horizontal Scroll (Carousel) */}
            <div className="relative group/carousel -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar">
                    {THEMES.map((theme) => {
                        const isActive = currentTheme === theme.id && !currentCustomTheme;
                        const Icon = theme.icon;

                        // Mock profile for preview
                        const previewProfile: any = {
                            displayName: 'Preview',
                            handle: 'preview',
                            bio: theme.description,
                            avatarUrl: '',
                            theme: theme.id,
                            links: []
                        };

                        const previewLinks: any[] = [
                            { id: '1', title: 'Link 1', url: '#', layoutConfig: { w: 1, h: 1 } },
                            { id: '2', title: '2', url: '#', layoutConfig: { w: 1, h: 1 } },
                        ];

                        return (
                            <div
                                role="button"
                                tabIndex={0}
                                key={theme.id}
                                onClick={() => onSelect(theme.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelect(theme.id);
                                    }
                                }}
                                className={`
                                    relative flex flex-col p-3 rounded-2xl border-2 transition-all duration-300 text-left h-full min-w-[160px] w-[160px] snap-start cursor-pointer
                                    ${isActive
                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-1 ring-indigo-600/20 scale-[1.02]'
                                        : 'border-stone-100 bg-white hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1'
                                    }
                                `}
                            >
                                {/* Visual Preview */}
                                <div className="w-full aspect-[9/14] mb-3 relative overflow-hidden rounded-xl bg-stone-100 ring-1 ring-black/5 shrink-0">
                                    <div className="absolute inset-0 origin-top-left w-[300%] h-[300%] scale-[0.33] pointer-events-none select-none">
                                        <BioPreview profile={previewProfile} links={previewLinks} />
                                    </div>
                                    {/* Overlay to prevent interaction */}
                                    <div className="absolute inset-0 bg-transparent" />

                                    {isActive && (
                                        <div className="absolute inset-0 ring-2 ring-indigo-600 rounded-xl z-20 pointer-events-none" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex items-center gap-2 mb-1 w-full">
                                    <div className={`
                                        p-1.5 rounded-lg transition-colors shrink-0
                                        ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-50 text-stone-400 group-hover:text-amber-500 group-hover:bg-amber-50'}
                                    `}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-bold text-xs truncate ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>{theme.name}</h4>
                                    </div>
                                </div>

                                <p className="text-[10px] text-stone-500 line-clamp-1 mb-2">{theme.description}</p>

                                {/* Color Swatches */}
                                <div className="flex gap-1 mt-auto">
                                    {theme.colors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="w-3 h-3 rounded-full ring-1 ring-black/5 shadow-sm"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>

                                {isActive && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center z-30 shadow-sm">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
