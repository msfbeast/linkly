import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Search, Star } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: any;
    onProductSelect: (product: Product) => void;
}

const NeubrutalismStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile, onProductSelect }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFF4E0] flex items-center justify-center">
                <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                    <span className="font-black text-2xl uppercase">Loading...</span>
                </div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'Neu.Store';
    const storeLogo = storeProfile?.storeLogoUrl;

    return (
        <div className="min-h-screen bg-[#FFF4E0] font-sans text-black selection:bg-[#FF6B6B] selection:text-white">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 p-4">
                <div className="bg-white border-4 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[#FF6B6B] border-2 border-black flex items-center justify-center overflow-hidden">
                            {storeLogo ? (
                                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-black text-xl text-white">{storeName.charAt(0)}</span>
                            )}
                        </div>
                        <span className="font-black text-2xl tracking-tighter uppercase">{storeName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="bg-[#4ECDC4] border-2 border-black p-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <Search className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[#FF6B6B] border-4 border-black p-8 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-block bg-white border-2 border-black px-4 py-1 font-bold uppercase mb-6 transform -rotate-2">
                                New Collection Drop
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black mb-8 uppercase leading-none text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                {storeName} <br /> Collection
                            </h1>
                            <p className="text-xl font-bold mb-8 max-w-xl bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                Stop blending in. Start standing out. Grab the gear that screams personality.
                            </p>
                            <button className="bg-black text-white border-4 border-transparent px-8 py-4 text-xl font-black uppercase hover:bg-white hover:text-black hover:border-black shadow-[8px_8px_0px_0px_#4ECDC4] hover:shadow-[4px_4px_0px_0px_#4ECDC4] hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                                Shop Now -&gt;
                            </button>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-10 right-10 w-32 h-32 bg-[#FFE66D] rounded-full border-4 border-black"></div>
                        <div className="absolute bottom-10 right-40 w-24 h-24 bg-[#4ECDC4] transform rotate-45 border-4 border-black"></div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12 flex items-center gap-4">
                        <Star className="w-8 h-8 fill-black" />
                        <h2 className="text-4xl font-black uppercase">Fresh Drops</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product, i) => (
                            <button
                                key={product.id}
                                onClick={() => onProductSelect(product)}
                                className="group block bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-200 w-full text-left"
                            >
                                <div className="aspect-square bg-white border-2 border-black mb-4 overflow-hidden relative">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-2 grayscale group-hover:grayscale-0 transition-all duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#4ECDC4]">
                                            <ShoppingBag className="w-12 h-12" />
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 bg-[#FFE66D] border-2 border-black px-3 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-xl uppercase leading-tight group-hover:underline decoration-4 decoration-[#FF6B6B]">{product.name}</h3>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="bg-black text-white px-2 py-1 text-xs font-bold uppercase">{product.category || 'Item'}</span>
                                        <div className="w-8 h-8 bg-[#4ECDC4] border-2 border-black flex items-center justify-center group-hover:bg-[#FF6B6B] transition-colors">
                                            <ArrowRight className="w-5 h-5 text-black" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default NeubrutalismStorefront;
