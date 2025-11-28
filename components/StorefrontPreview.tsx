import React from 'react';
import { Product } from '../types';
import VibrantStorefront from './storefront-templates/VibrantStorefront';
import GlassMorphismStorefront from './storefront-templates/GlassMorphismStorefront';
import CyberpunkStorefront from './storefront-templates/CyberpunkStorefront';
import RetroPopStorefront from './storefront-templates/RetroPopStorefront';
import NeubrutalismStorefront from './storefront-templates/NeubrutalismStorefront';
import LofiStorefront from './storefront-templates/LofiStorefront';
import ClaymorphismStorefront from './storefront-templates/ClaymorphismStorefront';
import BauhausStorefront from './storefront-templates/BauhausStorefront';
import IndustrialStorefront from './storefront-templates/IndustrialStorefront';
import LabStorefront from './storefront-templates/LabStorefront';
import ArchiveStorefront from './storefront-templates/ArchiveStorefront';

interface StorefrontPreviewProps {
    theme: string;
}

const StorefrontPreview: React.FC<StorefrontPreviewProps> = ({ theme }) => {
    // Mock products for preview
    const previewProducts: Product[] = [
        { id: '1', userId: 'preview', name: 'Premium Wireless Headphones', description: 'High-fidelity audio with noise cancellation.', price: 299, currency: 'USD', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', linkId: 'l1', createdAt: Date.now() },
        { id: '2', userId: 'preview', name: 'Ergonomic Mechanical Keyboard', description: 'Custom switches for the ultimate typing experience.', price: 149, currency: 'USD', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&auto=format&fit=crop&q=60', linkId: 'l2', createdAt: Date.now() },
        { id: '3', userId: 'preview', name: '4K Ultra HD Monitor', description: 'Crystal clear display for creative professionals.', price: 499, currency: 'USD', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60', linkId: 'l3', createdAt: Date.now() },
    ];

    const renderTemplate = () => {
        switch (theme) {
            case 'vibrant': return <VibrantStorefront products={previewProducts} loading={false} />;
            case 'glass': return <GlassMorphismStorefront products={previewProducts} loading={false} />;
            case 'cyberpunk': return <CyberpunkStorefront products={previewProducts} loading={false} />;
            case 'retro': return <RetroPopStorefront products={previewProducts} loading={false} />;
            case 'neubrutalism': return <NeubrutalismStorefront products={previewProducts} loading={false} />;
            case 'lofi': return <LofiStorefront products={previewProducts} loading={false} />;
            case 'clay': return <ClaymorphismStorefront products={previewProducts} loading={false} />;
            case 'bauhaus': return <BauhausStorefront products={previewProducts} loading={false} />;
            case 'industrial': return <IndustrialStorefront products={previewProducts} loading={false} />;
            case 'lab': return <LabStorefront products={previewProducts} loading={false} />;
            case 'archive': return <ArchiveStorefront products={previewProducts} loading={false} />;
            default: return <VibrantStorefront products={previewProducts} loading={false} />;
        }
    };

    return (
        <div className="relative w-full aspect-video bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
            <div className="absolute inset-0 origin-top-left transform scale-[0.33] w-[300%] h-[300%] pointer-events-none select-none">
                {renderTemplate()}
            </div>

            {/* Overlay to prevent interaction */}
            <div className="absolute inset-0 bg-transparent z-10" />

            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-900 shadow-sm z-20">
                Preview
            </div>
        </div>
    );
};

export default StorefrontPreview;
