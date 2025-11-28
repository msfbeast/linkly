import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Loader2, AlertCircle, Search, ArrowRight } from 'lucide-react';
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

    // handleProductClick function is removed as the new design uses <Link> directly.

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 selection:bg-yellow-200">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center shadow-sm border border-yellow-400/20">
                            <ShoppingBag className="w-5 h-5 text-slate-900" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Gather<span className="text-yellow-500">.</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-white border border-stone-200 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-yellow-400/50 transition-all">
                            <Search className="w-4 h-4 text-stone-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-48 placeholder-stone-400 text-slate-700"
                            />
                        </div>
                        <button className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm text-slate-700">
                            <ShoppingBag className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="bg-[#1F2937] rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-xl shadow-stone-200">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400 rounded-full blur-[100px] opacity-10 -translate-x-1/2 translate-y-1/2"></div>

                        <div className="relative z-10">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-yellow-300 text-sm font-medium mb-6 border border-white/5 backdrop-blur-sm">
                                New Collection 2024
                            </span>
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                                Curated for <span className="text-yellow-300 font-serif italic">Lifestyle.</span>
                            </h2>
                            <p className="text-stone-300 max-w-xl mx-auto text-lg mb-8 leading-relaxed">
                                Discover our hand-picked selection of premium products designed to elevate your everyday experience.
                            </p>
                            <button className="bg-yellow-300 text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-300/20">
                                Explore Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs (Visual Only) */}
                <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    {['All Products', 'Electronics', 'Lifestyle', 'Accessories'].map((tab, i) => (
                        <button
                            key={tab}
                            className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${i === 0
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            to={`/store/product/${product.id}`}
                            className="group bg-white rounded-[2rem] p-4 border border-stone-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1"
                        >
                            {/* Image Container */}
                            <div className="aspect-[4/3] bg-[#F4F4F5] rounded-[1.5rem] mb-5 overflow-hidden relative flex items-center justify-center group-hover:bg-[#F0F0F2] transition-colors">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-8 mix-blend-multiply filter contrast-[1.05] transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <ShoppingBag className="w-16 h-16 text-stone-300 group-hover:text-slate-400 transition-colors" />
                                )}

                                <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-sm border border-stone-100">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-2 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                        {product.name}
                                    </h3>
                                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                    </div>
                                </div>
                                <p className="text-stone-500 text-sm line-clamp-2 font-medium leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-8 h-8 text-stone-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Store is Empty</h3>
                        <p className="text-stone-500">Check back later for new products.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Storefront;
