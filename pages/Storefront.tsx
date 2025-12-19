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
import CheckoutModal from '../components/CheckoutModal';

const Storefront: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Use theme from URL param, or from user profile if viewing own storefront, or default to vibrant
    const theme = searchParams.get('theme') || (user?.id === userId ? user?.storefrontTheme : 'vibrant') || 'vibrant';

    const [products, setProducts] = useState<Product[]>([]);
    const [storeProfile, setStoreProfile] = useState<any>(null); // Use any or UserProfile if imported
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchStoreData();
        }
    }, [userId]);

    const fetchStoreData = async () => {
        try {
            if (!userId) return;

            let targetUserId = userId;

            // Check if userId is a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

            if (!isUuid) {
                // Assume it's a handle, resolve to userId
                const profile = await supabaseAdapter.getBioProfileByHandle(userId);
                if (profile) {
                    targetUserId = profile.userId;
                } else {
                    setError('Store not found');
                    return;
                }
            }

            const [fetchedProducts, fetchedProfile] = await Promise.all([
                supabaseAdapter.getProducts(targetUserId),
                supabaseAdapter.getUserProfile(targetUserId)
            ]);

            setProducts(fetchedProducts);
            setStoreProfile(fetchedProfile);
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store.');
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
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Render the selected template
    const handleProductSelect = (product: Product) => {
        if (product.type === 'digital') {
            setSelectedProduct(product);
        } else if (product.originalUrl) {
            // Physical/Affiliate Link
            window.open(product.originalUrl, '_blank');
        }
    };

    const templateProps = {
        products,
        loading,
        storeProfile,
        onProductSelect: handleProductSelect
    };

    const renderTemplate = () => {
        switch (theme) {
            case 'vibrant':
                return <VibrantStorefront {...templateProps} />;
            case 'glass':
                return <GlassMorphismStorefront {...templateProps} />;
            case 'cyberpunk':
                return <CyberpunkStorefront {...templateProps} />;
            case 'retro':
                return <RetroPopStorefront {...templateProps} />;
            case 'neubrutalism':
                return <NeubrutalismStorefront {...templateProps} />;
            case 'lofi':
                return <LofiStorefront {...templateProps} />;
            case 'clay':
                return <ClaymorphismStorefront {...templateProps} />;
            case 'bauhaus':
                return <BauhausStorefront {...templateProps} />;
            case 'industrial':
                return <IndustrialStorefront {...templateProps} />;
            case 'lab':
                return <LabStorefront {...templateProps} />;
            case 'archive':
                return <ArchiveStorefront {...templateProps} />;
            default:
                return <VibrantStorefront {...templateProps} />;
        }
    };

    return (
        <>
            {renderTemplate()}
            {selectedProduct && (
                <CheckoutModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    storeName={storeProfile?.storeName || 'Store'}
                />
            )}
        </>
    );
};

export default Storefront;
