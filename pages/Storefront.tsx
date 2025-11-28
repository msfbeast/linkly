import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
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

const Storefront: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Use theme from URL param, or from user profile if viewing own storefront, or default to vibrant
    const theme = searchParams.get('theme') || (user?.id === userId ? user?.storefrontTheme : 'vibrant') || 'vibrant';

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchProducts();
        }
    }, [userId]);

    const fetchProducts = async () => {
        try {
            if (!userId) return;
            const fetchedProducts = await supabaseAdapter.getProducts(userId);
            setProducts(fetchedProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load store products.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    // Render the selected template
    switch (theme) {
        case 'vibrant':
            return <VibrantStorefront products={products} loading={loading} />;
        case 'glass':
            return <GlassMorphismStorefront products={products} loading={loading} />;
        case 'cyberpunk':
            return <CyberpunkStorefront products={products} loading={loading} />;
        case 'retro':
            return <RetroPopStorefront products={products} loading={loading} />;
        case 'neubrutalism':
            return <NeubrutalismStorefront products={products} loading={loading} />;
        case 'lofi':
            return <LofiStorefront products={products} loading={loading} />;
        case 'clay':
            return <ClaymorphismStorefront products={products} loading={loading} />;
        case 'bauhaus':
            return <BauhausStorefront products={products} loading={loading} />;
        case 'industrial':
            return <IndustrialStorefront products={products} loading={loading} />;
        case 'lab':
            return <LabStorefront products={products} loading={loading} />;
        case 'archive':
            return <ArchiveStorefront products={products} loading={loading} />;
        default:
            // Default fallback to Vibrant
            return <VibrantStorefront products={products} loading={loading} />;
    }
};

export default Storefront;
