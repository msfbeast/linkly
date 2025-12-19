import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Heart, ArrowRight } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: any;
    onProductSelect: (product: Product) => void;
}

const ClaymorphismStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile, onProductSelect }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
                <div className="w-16 h-16 bg-[#f0f4f8] rounded-full flex items-center justify-center animate-bounce"
                    style={{
                        boxShadow: 'inset 6px 6px 12px #cdd5e0, inset -6px -6px 12px #ffffff'
                    }}
                >
                    <div className="w-8 h-8 bg-[#7b61ff] rounded-full"></div>
                </div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'Clay.io';
    const storeLogo = storeProfile?.storeLogoUrl;

    return (
        <div className="min-h-screen bg-[#f0f4f8] font-sans text-slate-700 selection:bg-[#7b61ff] selection:text-white">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 px-6 py-6 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="bg-[#f0f4f8] px-6 py-3 rounded-3xl flex items-center gap-3"
                        style={{
                            boxShadow: '8px 8px 16px #cdd5e0, -8px -8px 16px #ffffff'
                        }}
                    >
                        <div className="w-10 h-10 bg-[#7b61ff] rounded-2xl flex items-center justify-center text-white font-black text-xl transform rotate-3 overflow-hidden">
                            {storeLogo ? (
                                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
                            ) : (
                                <span>{storeName.charAt(0)}</span>
                            )}
                        </div>
                        <span className="font-bold text-xl text-slate-700">{storeName}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="w-12 h-12 bg-[#f0f4f8] rounded-2xl flex items-center justify-center text-slate-500 hover:text-[#7b61ff] transition-colors active:scale-95"
                            style={{
                                boxShadow: '8px 8px 16px #cdd5e0, -8px -8px 16px #ffffff'
                            }}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-[#f0f4f8] rounded-[3rem] p-12 md:p-20 relative overflow-hidden"
                        style={{
                            boxShadow: '20px 20px 60px #cdd5e0, -20px -20px 60px #ffffff'
                        }}
                    >
                        <div className="relative z-10 max-w-2xl">
                            <span className="inline-block px-4 py-2 rounded-xl bg-[#f0f4f8] text-[#7b61ff] font-bold text-sm mb-6"
                                style={{
                                    boxShadow: 'inset 4px 4px 8px #cdd5e0, inset -4px -4px 8px #ffffff'
                                }}
                            >
                                SOFT & SQUISHY
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black mb-8 text-slate-800 leading-tight">
                                {storeName} <br />
                                <span className="text-[#7b61ff]">Real Comfort</span>
                            </h1>
                            <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                                Experience a shopping interface that feels real. Soft shadows, rounded corners, and a touch of playfulness.
                            </p>
                            <button className="bg-[#7b61ff] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#7b61ff]/30">
                                Start Shopping
                            </button>
                        </div>

                        {/* Floating 3D Elements */}
                        <div className="absolute top-20 right-20 w-40 h-40 bg-[#ff6b6b] rounded-full opacity-20 blur-3xl animate-float"></div>
                        <div className="absolute bottom-20 right-40 w-60 h-60 bg-[#7b61ff] rounded-full opacity-20 blur-3xl animate-float [animation-delay:2s]"></div>

                        {/* Clay Shapes */}
                        <div className="absolute top-1/2 right-20 transform -translate-y-1/2 hidden lg:block">
                            <div className="w-64 h-64 bg-[#f0f4f8] rounded-[3rem] transform rotate-12"
                                style={{
                                    boxShadow: '20px 20px 60px #cdd5e0, -20px -20px 60px #ffffff'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {products.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => onProductSelect(product)}
                                className="group block bg-[#f0f4f8] rounded-[2.5rem] p-6 shadow-[12px_12px_24px_#cdd5e0,-12px_-12px_24px_#ffffff] transition-all duration-300 hover:scale-[1.02] w-full text-left"
                            >
                                <div className="aspect-square rounded-[2rem] mb-6 overflow-hidden relative bg-[#f0f4f8]"
                                    style={{
                                        boxShadow: 'inset 8px 8px 16px #cdd5e0, inset -8px -8px 16px #ffffff'
                                    }}
                                >
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-slate-300" />
                                        </div>
                                    )}

                                    <button className="absolute top-4 right-4 w-10 h-10 bg-[#f0f4f8] rounded-xl flex items-center justify-center text-slate-400 hover:text-[#ff6b6b] transition-colors shadow-sm"
                                        style={{
                                            boxShadow: '4px 4px 8px #cdd5e0, -4px -4px 8px #ffffff'
                                        }}
                                    >
                                        <Heart className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="px-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-slate-700 leading-tight group-hover:text-[#7b61ff] transition-colors">{product.name}</h3>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">{product.category || 'Item'}</span>
                                        <span className="text-lg font-black text-[#7b61ff]">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                        </span>
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

export default ClaymorphismStorefront;
