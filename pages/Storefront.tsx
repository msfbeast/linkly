import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { supabase } from '../services/storage/supabaseClient';

const Storefront: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
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

    const handleProductClick = async (product: Product) => {
        // In a real app, we would redirect to the tracked link
        // For now, we'll simulate it by finding the link and "clicking" it
        try {
            const link = await supabaseAdapter.getLink(product.linkId);
            if (link) {
                // Record the click (this would normally happen on the redirect page)
                // But since we are in the app, we can just redirect to the original URL
                // OR redirect to our /r/:shortCode route
                window.open(`/r/${link.shortCode}`, '_blank');
            }
        } catch (err) {
            console.error('Error handling product click:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <div className="bg-[#12121a] border-b border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold">Storefront</h1>
                    </div>
                    <p className="text-slate-400">Browse our collection of premium products.</p>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group">
                            <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                                        <ShoppingBag className="w-16 h-16 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <button
                                        onClick={() => handleProductClick(product)}
                                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        View Details <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-sm font-bold">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </span>
                                </div>
                                <p className="text-slate-400 line-clamp-2 mb-4">{product.description}</p>
                            </div>
                        </div>
                    ))}

                    {products.length === 0 && (
                        <div className="col-span-full text-center py-20">
                            <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-300">No products found</h3>
                            <p className="text-slate-500 mt-2">This store hasn't added any products yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Storefront;
