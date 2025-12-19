import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Square, Circle, Triangle } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: any;
    onProductSelect: (product: Product) => void;
}

const BauhausStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile, onProductSelect }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
                <div className="flex gap-2">
                    <div className="w-8 h-8 bg-[#e63946] rounded-full animate-bounce [animation-delay:0s]"></div>
                    <div className="w-8 h-8 bg-[#1d3557] animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-8 h-8 bg-[#f1faee] border-4 border-[#e63946] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'Bau Haus';
    const storeLogo = storeProfile?.storeLogoUrl;

    return (
        <div className="min-h-screen bg-[#f4f1ea] font-sans text-[#1d1d1d] selection:bg-[#e63946] selection:text-white">
            {/* Geometric Sidebar / Border */}
            <div className="fixed left-0 top-0 bottom-0 w-4 md:w-8 bg-[#1d3557] z-50"></div>
            <div className="fixed right-0 top-0 bottom-0 w-4 md:w-8 bg-[#e63946] z-50"></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-40 px-8 py-8 pointer-events-none">
                <div className="max-w-7xl mx-auto flex justify-between items-start pointer-events-auto">
                    <div className="bg-[#1d1d1d] text-[#f4f1ea] p-6 shadow-[-10px_10px_0px_#e63946] flex items-center gap-4">
                        {storeLogo && (
                            <img src={storeLogo} alt={storeName} className="w-12 h-12 object-cover border-2 border-[#f4f1ea]" />
                        )}
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            {storeName}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-12 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-[#1d1d1d]">
                        <div className="p-12 md:p-20 bg-[#e63946] text-[#f4f1ea] flex flex-col justify-center relative overflow-hidden">
                            <Circle className="absolute -top-20 -left-20 w-60 h-60 text-[#1d3557] opacity-20" />
                            <h2 className="text-5xl md:text-7xl font-black uppercase mb-6 relative z-10">
                                Form <br /> Follows <br /> Function
                            </h2>
                            <p className="text-xl font-medium max-w-md relative z-10">
                                Design is not just what it looks like and feels like. Design is how it works.
                            </p>
                        </div>
                        <div className="p-12 md:p-20 bg-[#f1faee] flex flex-col justify-center items-start relative overflow-hidden">
                            <Triangle className="absolute -bottom-20 -right-20 w-80 h-80 text-[#e63946] opacity-10 rotate-12" />
                            <div className="w-20 h-20 bg-[#1d3557] rounded-full mb-8"></div>
                            <h3 className="text-3xl font-bold mb-8">Essential Collection</h3>
                            <button className="bg-[#1d1d1d] text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#e63946] transition-colors">
                                View Catalog
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-20 px-12 md:px-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {products.map((product, index) => (
                            <button
                                key={product.id}
                                onClick={() => onProductSelect(product)}
                                className="group block w-full text-left"
                            >
                                <div className="border-4 border-[#1d1d1d] bg-white transition-transform duration-300 hover:-translate-y-2 hover:shadow-[10px_10px_0px_#1d3557]">
                                    <div className="aspect-square border-b-4 border-[#1d1d1d] overflow-hidden relative">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${index % 3 === 0 ? 'bg-[#e63946]' : index % 3 === 1 ? 'bg-[#1d3557]' : 'bg-[#f1faee]'}`}>
                                                <Square className={`w-16 h-16 ${index % 3 === 2 ? 'text-[#1d1d1d]' : 'text-white'}`} />
                                            </div>
                                        )}

                                        <div className="absolute top-0 left-0 bg-[#1d1d1d] text-white px-3 py-1 font-bold text-sm">
                                            0{index + 1}
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-black uppercase mb-2 truncate">{product.name}</h3>
                                        <div className="w-10 h-1 bg-[#e63946] mb-4"></div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-gray-500 uppercase">{product.category || 'Object'}</span>
                                            <span className="text-xl font-bold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                            </span>
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

export default BauhausStorefront;
