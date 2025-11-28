import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Search, Menu } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
}

const GlassMorphismStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center animate-pulse border border-white/20">
                    <div className="w-8 h-8 bg-white/40 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] font-sans text-white selection:bg-white/30">
            {/* Background Orbs (Monochrome) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-white/5 rounded-full blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-white/10 rounded-full blur-[120px] animate-float [animation-delay:2s]"></div>
                <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-neutral-800/20 rounded-full blur-[100px] animate-float [animation-delay:4s]"></div>
            </div>

            {/* Glass Header */}
            <header className="fixed top-0 w-full z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl shadow-black/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <span className="font-bold text-lg">G</span>
                        </div>
                        <span className="font-bold text-lg tracking-wide">Glass.BW</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
                        <a href="#" className="hover:text-white transition-colors hover:bg-white/5 px-3 py-1 rounded-lg">Collections</a>
                        <a href="#" className="hover:text-white transition-colors hover:bg-white/5 px-3 py-1 rounded-lg">About</a>
                        <a href="#" className="hover:text-white transition-colors hover:bg-white/5 px-3 py-1 rounded-lg">Contact</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
                        </button>
                        <button className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-6 px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-white/80 shadow-lg">
                        Pure Monochrome Aesthetics
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight drop-shadow-2xl">
                        Crystal Clear <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Simplicity</span>
                    </h1>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Minimalist design meets depth. A storefront that puts your products in focus without the noise.
                    </p>
                    <button className="bg-white text-black px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Start Exploring
                    </button>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/store/product/${product.id}`}
                                className="group block bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-4 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 shadow-xl shadow-black/20"
                            >
                                <div className="aspect-square bg-white/5 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                        />
                                    ) : (
                                        <ShoppingBag className="w-12 h-12 text-white/20" />
                                    )}

                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold border border-white/10 text-white">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </div>
                                </div>

                                <div className="px-2 pb-2">
                                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-white/80 transition-colors">{product.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white/40">{product.category || 'General'}</span>
                                        <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors text-white">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default GlassMorphismStorefront;
