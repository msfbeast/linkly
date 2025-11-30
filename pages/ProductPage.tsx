import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ExternalLink, Loader2, AlertCircle, Check, Share2, Zap } from 'lucide-react';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

const ProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buying, setBuying] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        try {
            if (!productId) return;

            let fetchedProduct: Product | null = null;

            // Check if productId is a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

            if (isUuid) {
                fetchedProduct = await supabaseAdapter.getProductById(productId);
            } else {
                fetchedProduct = await supabaseAdapter.getProductBySlug(productId);
            }

            if (!fetchedProduct) {
                setError('Product not found.');
                return;
            }

            setProduct(fetchedProduct);
        } catch (err) {
            console.error('Error fetching product:', err);
            setError('Product not found.');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product) return;
        setBuying(true);
        try {
            const link = await supabaseAdapter.getLink(product.linkId);
            if (link) {
                // Simulate tracking click
                // In production, we'd hit the tracking endpoint
                window.open(`/r/${link.shortCode}`, '_blank');
            }
        } catch (err) {
            console.error('Error handling buy click:', err);
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error || 'Product not found'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-yellow-200">
            {/* Header */}
            <div className="py-6 px-6 sticky top-0 z-20 bg-[#FDFBF7]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-stone-500 hover:text-slate-900 transition-colors font-medium group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-stone-300 transition-colors">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="hidden sm:inline">Back to Store</span>
                    </button>
                    <div className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm">
                        <ShoppingBag className="w-4 h-4 text-slate-900" />
                        <span className="font-bold text-sm text-slate-900">Gather Store</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    {/* Image Section - Floating Island */}
                    <div className="relative sticky top-32">
                        <div className="aspect-square bg-white rounded-[3rem] overflow-hidden relative shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-stone-100 flex items-center justify-center p-12">
                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-50/50 via-transparent to-transparent opacity-50"></div>
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain mix-blend-multiply filter contrast-[1.05] drop-shadow-xl"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <ShoppingBag className="w-32 h-32 text-stone-200" />
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex justify-center gap-8 mt-8">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center shadow-sm text-emerald-500">
                                    <Check className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Authentic</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center shadow-sm text-yellow-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Fast Ship</span>
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center pt-8">
                        <div className="mb-2">
                            <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider mb-4">
                                New Arrival
                            </span>
                            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-stone-200">
                                <span className="text-4xl font-bold text-slate-900">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                </span>
                                <span className="text-stone-400 text-lg line-through font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price * 1.2)}
                                </span>
                            </div>
                        </div>

                        <div className="prose prose-lg prose-stone mb-10 text-stone-600 leading-relaxed">
                            <p>{product.description}</p>
                        </div>

                        <div className="flex gap-4 sticky bottom-6 z-30 bg-[#FDFBF7]/90 backdrop-blur p-4 -m-4 rounded-t-[2rem] lg:static lg:bg-transparent lg:p-0 lg:m-0">
                            <button
                                onClick={handleBuyNow}
                                disabled={buying}
                                className="flex-1 bg-slate-900 text-white font-bold py-5 rounded-[2rem] hover:bg-slate-800 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg shadow-xl shadow-slate-900/20"
                            >
                                {buying ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingBag className="w-6 h-6" />}
                                Add to Cart
                            </button>
                            <button className="w-16 h-16 bg-white text-slate-900 rounded-[2rem] hover:bg-stone-50 transition-colors border border-stone-200 shadow-sm flex items-center justify-center">
                                <Share2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
