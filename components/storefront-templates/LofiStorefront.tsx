import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Coffee, Music, Heart } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
}

const LofiStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Coffee className="w-12 h-12 text-[#8E7C68] animate-bounce" />
                    <span className="font-mono text-[#8E7C68]">brewing content...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F2E8] font-mono text-[#5C4B51] selection:bg-[#F0A6CA] selection:text-white">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 px-6 py-6">
                <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-[4px_4px_0px_#E2C2C6] border-2 border-[#5C4B51] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F0A6CA] rounded-full border-2 border-[#5C4B51] flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">lofi.shop</span>
                    </div>

                    <nav className="hidden md:flex gap-8 text-sm font-medium">
                        <a href="#" className="hover:text-[#F0A6CA] transition-colors">study</a>
                        <a href="#" className="hover:text-[#F0A6CA] transition-colors">relax</a>
                        <a href="#" className="hover:text-[#F0A6CA] transition-colors">vibe</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button className="bg-[#99C1B9] p-2 rounded-lg border-2 border-[#5C4B51] shadow-[2px_2px_0px_#5C4B51] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#5C4B51] transition-all">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-3xl border-2 border-[#5C4B51] p-8 md:p-12 shadow-[8px_8px_0px_#8E7C68] relative overflow-hidden">
                        <div className="relative z-10 max-w-lg">
                            <div className="inline-block bg-[#F0A6CA] text-white px-3 py-1 rounded-full text-xs font-bold mb-4 border-2 border-[#5C4B51]">
                                chill vibes only
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                                Cozy Essentials <br />
                                <span className="text-[#99C1B9]">For Your Space</span>
                            </h1>
                            <p className="text-lg mb-8 leading-relaxed opacity-80">
                                A curated collection of things that make you feel at home.
                                Put on some headphones, grab a tea, and browse.
                            </p>
                            <button className="bg-[#F2D7EE] text-[#5C4B51] px-6 py-3 rounded-xl font-bold border-2 border-[#5C4B51] shadow-[4px_4px_0px_#5C4B51] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#5C4B51] transition-all">
                                Start Browsing
                            </button>
                        </div>

                        {/* Decorative Blob */}
                        <div className="absolute top-1/2 -right-20 transform -translate-y-1/2 w-64 h-64 bg-[#D8E2DC] rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                        <div className="absolute bottom-[-50px] right-[100px] w-40 h-40 bg-[#FFE5D9] rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-10 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/store/product/${product.id}`}
                                className="group block bg-white rounded-2xl border-2 border-[#5C4B51] p-3 shadow-[4px_4px_0px_#E2C2C6] hover:shadow-[6px_6px_0px_#E2C2C6] hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className="aspect-square bg-[#F7F2E8] rounded-xl mb-3 overflow-hidden relative border-2 border-[#5C4B51]/10">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Coffee className="w-10 h-10 text-[#8E7C68]/50" />
                                        </div>
                                    )}

                                    <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-[#5C4B51] shadow-[2px_2px_0px_#5C4B51] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Heart className="w-4 h-4 text-[#F0A6CA]" />
                                    </button>
                                </div>

                                <div className="px-1">
                                    <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs bg-[#D8E2DC] px-2 py-1 rounded-md border border-[#5C4B51]/20">
                                            {product.category || 'misc'}
                                        </span>
                                        <span className="font-bold text-[#F0A6CA]">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                        </span>
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

export default LofiStorefront;
