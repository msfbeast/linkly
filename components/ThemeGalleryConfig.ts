import { BioThemeConfig } from '../types';

export interface ThemePreset {
    id: string;
    name: string;
    previewColor: string;
    config: BioThemeConfig;
}

export const PRESET_THEMES: ThemePreset[] = [
    {
        id: 'pastel-pop',
        name: 'Pastel Pop',
        previewColor: '#e0f2fe',
        config: {
            backgroundType: 'solid',
            backgroundValue: '#e0f2fe', // Light blue
            textColor: '#0f172a',
            buttonStyle: 'hard-shadow',
            buttonColor: '#f43f5e', // Neon red
            buttonTextColor: '#fff',
            font: 'space-mono'
        }
    },
    {
        id: 'bakery',
        name: 'Sweetest Bean',
        previewColor: '#e5e5e5',
        config: {
            backgroundType: 'solid',
            backgroundValue: '#f3f4f6',
            textColor: '#4b5563',
            buttonStyle: 'wavy', // Will implement this
            buttonColor: '#ffffff',
            buttonTextColor: '#374151',
            font: 'lora' // Serif
        }
    },
    {
        id: 'minimal-fashion',
        name: 'Minimal Fashion',
        previewColor: '#1c1917',
        config: {
            backgroundType: 'image',
            backgroundValue: 'https://images.unsplash.com/photo-1490481651871-ab253a2c5d13?q=80&w=2970&auto=format&fit=crop', // Minimalist
            textColor: '#ffffff',
            buttonStyle: 'outline',
            buttonColor: '#ffffff',
            buttonTextColor: '#ffffff',
            font: 'poppins'
        }
    },
    {
        id: 'sunset-vibes',
        name: 'Sunset Vibes',
        previewColor: '#f9a8d4',
        config: {
            backgroundType: 'gradient',
            // Correct CSS linear-gradient syntax
            backgroundValue: 'linear-gradient(to bottom, #f9a8d4, #f472b6, #fca5a5)',
            textColor: '#ffffff',
            buttonStyle: 'pill',
            buttonColor: 'rgba(255, 255, 255, 0.4)',
            buttonTextColor: '#ffffff',
            font: 'outfit'
        }
    }
];
