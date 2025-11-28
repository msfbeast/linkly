import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Settings, Box, Crosshair } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
}

const IndustrialStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#E2E2E2] flex items-center justify-center">
                <Settings className="w-12 h-12 text-slate-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E2E2E2] font-mono text-slate-800 selection:bg-slate-800 selection:text-white">
            {/* Technical Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#E2E2E2]/90 backdrop-blur-sm border-b border-slate-400">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="border border-slate-800 p-1">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold uppercase tracking-wider">IND.SUPPLY</h1>
                            <p className="text-[10px] text-slate-500">EST. 2025 // SECTOR 7</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden md:block text-[10px] text-slate-500 text-right">
                            <p>SYS.STATUS: ONLINE</p>
                            <p>LAT: 40.7128 N / LON: 74.0060 W</p>
                        </div>
                        <button className="bg-slate-800 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            <span>Cart [0]</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto border border-slate-400 bg-[#F0F0F0] p-8 md:p-16 relative">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-800"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-800"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-800"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-800"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-slate-300 px-2 py-1 text-[10px] font-bold uppercase mb-6">
                                Ref: 884-XJ
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold uppercase mb-6 tracking-tight text-slate-900">
                                Engineered <br /> for Utility.
                            </h2>
                            <p className="text-slate-600 text-sm mb-8 max-w-md leading-relaxed">
                                Precision-crafted goods for the modern workspace. Durable materials, functional design, and industrial aesthetics.
                            </p>
                            <button className="border border-slate-800 px-8 py-3 text-xs font-bold uppercase hover:bg-slate-800 hover:text-white transition-colors">
                                Access Catalog
                            </button>
                        </div>
                        <div className="h-64 bg-slate-300 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
                                {[...Array(36)].map((_, i) => (
                                    <div key={i} className="border border-slate-400/20"></div>
                                ))}
                            </div>
                            <Crosshair className="w-24 h-24 text-slate-400 animate-spin-slow" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-400 pb-2">
                        <h3 className="text-sm font-bold uppercase">Inventory List</h3>
                        <span className="text-xs text-slate-500">Total Items: {products.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product, index) => (
                            <Link
                                key={product.id}
                                to={`/store/product/${product.id}`}
                                className="group block bg-[#F0F0F0] border border-slate-300 hover:border-slate-800 transition-colors"
                            >
                                <div className="p-4 border-b border-slate-300 flex justify-between items-center text-[10px] text-slate-500 uppercase">
                                    <span>ID: {product.id.substring(0, 6)}</span>
                                    <span>Batch: 00{index + 1}</span>
                                </div>

                                <div className="aspect-square bg-white p-8 relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain filter grayscale contrast-125 group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-300">
                                            <Box className="w-12 h-12 text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <h4 className="text-lg font-bold uppercase mb-2 truncate group-hover:text-slate-600 transition-colors">{product.name}</h4>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase mb-1">Category</p>
                                            <p className="text-xs font-bold uppercase bg-slate-200 px-2 py-1 inline-block">{product.category || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 uppercase mb-1">Unit Price</p>
                                            <p className="text-lg font-bold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                            </p>
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

export default IndustrialStorefront;
