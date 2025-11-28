import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VibrantStorefront from '../components/storefront-templates/VibrantStorefront';
import GlassMorphismStorefront from '../components/storefront-templates/GlassMorphismStorefront';
import CyberpunkStorefront from '../components/storefront-templates/CyberpunkStorefront';
import RetroPopStorefront from '../components/storefront-templates/RetroPopStorefront';
import NeubrutalismStorefront from '../components/storefront-templates/NeubrutalismStorefront';
import LofiStorefront from '../components/storefront-templates/LofiStorefront';
import ClaymorphismStorefront from '../components/storefront-templates/ClaymorphismStorefront';
import BauhausStorefront from '../components/storefront-templates/BauhausStorefront';
import IndustrialStorefront from '../components/storefront-templates/IndustrialStorefront';
import LabStorefront from '../components/storefront-templates/LabStorefront';
import ArchiveStorefront from '../components/storefront-templates/ArchiveStorefront';
import { Product } from '../types';

const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        userId: 'test',
        name: 'Premium Leather Backpack',
        description: 'Handcrafted from full-grain leather, this backpack features a padded laptop sleeve and multiple compartments for organization.',
        price: 199.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
        linkId: 'link1',
        category: 'Accessories',
        createdAt: Date.now()
    },
    {
        id: '2',
        userId: 'test',
        name: 'Wireless Noise-Cancelling Headphones',
        description: 'Immerse yourself in music with our latest noise-cancelling technology. 30-hour battery life and ultra-comfortable ear cups.',
        price: 299.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        linkId: 'link2',
        category: 'Electronics',
        createdAt: Date.now()
    },
    {
        id: '3',
        userId: 'test',
        name: 'Smart Fitness Watch',
        description: 'Track your health and fitness goals with precision. Features heart rate monitoring, GPS, and sleep tracking.',
        price: 149.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        linkId: 'link3',
        category: 'Wearables',
        createdAt: Date.now()
    },
    {
        id: '4',
        userId: 'test',
        name: 'Minimalist Desk Lamp',
        description: 'Illuminate your workspace with this sleek and modern desk lamp. Adjustable brightness and color temperature.',
        price: 89.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1507473888900-52e1adad5420?auto=format&fit=crop&w=800&q=80',
        linkId: 'link4',
        category: 'Home',
        createdAt: Date.now()
    }
];

const TestStorefront: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const theme = searchParams.get('theme') || 'vibrant';

    const switchTheme = (newTheme: string) => {
        setSearchParams({ theme: newTheme });
    };

    return (
        <div>
            <div className="fixed bottom-4 right-4 z-[100] bg-white p-4 rounded-lg shadow-xl border border-gray-200 flex flex-wrap gap-2 max-w-md justify-end">
                <button onClick={() => switchTheme('vibrant')} className={`px-3 py-1 rounded text-xs ${theme === 'vibrant' ? 'bg-[#FF3366] text-white' : 'bg-gray-100'}`}>Vibrant</button>
                <button onClick={() => switchTheme('glass')} className={`px-3 py-1 rounded text-xs ${theme === 'glass' ? 'bg-black text-white' : 'bg-gray-100'}`}>Glass BW</button>
                <button onClick={() => switchTheme('cyberpunk')} className={`px-3 py-1 rounded text-xs ${theme === 'cyberpunk' ? 'bg-[#00ff00] text-black' : 'bg-gray-100'}`}>Cyberpunk</button>
                <button onClick={() => switchTheme('retro')} className={`px-3 py-1 rounded text-xs ${theme === 'retro' ? 'bg-[#FFCC00] text-black' : 'bg-gray-100'}`}>Retro</button>
                <button onClick={() => switchTheme('neubrutalism')} className={`px-3 py-1 rounded text-xs ${theme === 'neubrutalism' ? 'bg-[#FF6B6B] text-white' : 'bg-gray-100'}`}>Neubrutalism</button>
                <button onClick={() => switchTheme('lofi')} className={`px-3 py-1 rounded text-xs ${theme === 'lofi' ? 'bg-[#F7F2E8] text-[#5C4B51]' : 'bg-gray-100'}`}>Lofi</button>
                <button onClick={() => switchTheme('clay')} className={`px-3 py-1 rounded text-xs ${theme === 'clay' ? 'bg-[#f0f4f8] text-[#7b61ff]' : 'bg-gray-100'}`}>Clay</button>
                <button onClick={() => switchTheme('bauhaus')} className={`px-3 py-1 rounded text-xs ${theme === 'bauhaus' ? 'bg-[#f4f1ea] text-[#e63946]' : 'bg-gray-100'}`}>Bauhaus</button>
                <button onClick={() => switchTheme('industrial')} className={`px-3 py-1 rounded text-xs ${theme === 'industrial' ? 'bg-[#E2E2E2] text-slate-800 border border-slate-600' : 'bg-gray-100'}`}>Industrial</button>
                <button onClick={() => switchTheme('lab')} className={`px-3 py-1 rounded text-xs ${theme === 'lab' ? 'bg-white text-black border border-black' : 'bg-gray-100'}`}>Lab</button>
                <button onClick={() => switchTheme('archive')} className={`px-3 py-1 rounded text-xs ${theme === 'archive' ? 'bg-[#F0F0F0] text-[#333]' : 'bg-gray-100'}`}>Archive</button>
            </div>

            {theme === 'vibrant' && <VibrantStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'glass' && <GlassMorphismStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'cyberpunk' && <CyberpunkStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'retro' && <RetroPopStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'neubrutalism' && <NeubrutalismStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'lofi' && <LofiStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'clay' && <ClaymorphismStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'bauhaus' && <BauhausStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'industrial' && <IndustrialStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'lab' && <LabStorefront products={MOCK_PRODUCTS} loading={false} />}
            {theme === 'archive' && <ArchiveStorefront products={MOCK_PRODUCTS} loading={false} />}
        </div>
    );
};

export default TestStorefront;
