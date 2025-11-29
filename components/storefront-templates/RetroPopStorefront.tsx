import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart, MousePointer } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
}

const RetroPopStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#000080] flex items-center justify-center">
                <div className="bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1">
                    <div className="bg-[#000080] text-white px-2 py-1 font-bold font-mono text-sm flex justify-between items-center w-64">
                        <span>Loading...</span>
                        <span className="cursor-pointer">X</span>
                    </div>
                    <div className="p-4 flex flex-col items-center gap-4">
                        <div className="w-full h-4 bg-white border border-gray-500 relative">
                            <div className="h-full bg-[#000080] w-1/2 animate-pulse"></div>
                        </div>
                        <span className="font-mono text-xs">Please wait...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFCC00] font-mono text-black selection:bg-[#FF00FF] selection:text-white overflow-x-hidden"
            style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            {/* Windows 95 Style Header */}
            <header className="fixed top-0 w-full z-50 bg-[#C0C0C0] border-b-2 border-black p-1 shadow-md">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-6 h-6 flex items-center justify-center text-white font-bold text-xs border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                            W
                        </div>
                        <span className="font-bold">RetroStore.exe</span>
                    </div>

                    <div className="flex gap-1">
                        <button className="w-5 h-5 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center font-bold text-xs active:border-t-black active:border-l-black active:border-b-white active:border-r-white">_</button>
                        <button className="w-5 h-5 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center font-bold text-xs active:border-t-black active:border-l-black active:border-b-white active:border-r-white">□</button>
                        <button className="w-5 h-5 bg-[#C0C0C0] border-t border-l border-white border-b border-r border-black flex items-center justify-center font-bold text-xs active:border-t-black active:border-l-black active:border-b-white active:border-r-white">X</button>
                    </div>
                </div>

                <nav className="flex gap-4 px-2 py-1 text-sm border-t border-gray-400 mt-1">
                    <a href="#" className="underline hover:text-blue-600">File</a>
                    <a href="#" className="underline hover:text-blue-600">Edit</a>
                    <a href="#" className="underline hover:text-blue-600">View</a>
                    <a href="#" className="underline hover:text-blue-600">Help</a>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-12 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 font-bold text-sm flex justify-between items-center">
                            <span>Welcome to the 90s</span>
                            <span className="cursor-pointer">?</span>
                        </div>
                        <div className="p-8 bg-white border-2 border-gray-400 inset-shadow">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-4xl md:text-6xl font-bold mb-4 text-[#FF00FF] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                                        Cool Stuff <br /> Inside!
                                    </h1>
                                    <p className="mb-6 text-lg">
                                        Surfing the world wide web for the raddest gear? You found it!
                                    </p>
                                    <button className="bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black px-6 py-2 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white active:translate-y-1 flex items-center gap-2 mx-auto md:mx-0">
                                        <MousePointer className="w-4 h-4" />
                                        Click Here!
                                    </button>
                                </div>
                                <div className="w-48 h-48 bg-blue-200 border-2 border-black flex items-center justify-center relative">
                                    <div className="absolute -top-4 -right-4 bg-yellow-300 border-2 border-black px-2 py-1 font-bold transform rotate-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        NEW!
                                    </div>
                                    <span className="text-4xl">💾</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee */}
            <div className="bg-black text-[#00ff00] py-2 font-mono overflow-hidden border-y-2 border-white mb-12">
                <div className="animate-marquee whitespace-nowrap">
                    *** WELCOME TO THE SHOP *** BEST DEALS ONLINE *** SIGN GUESTBOOK *** UNDER CONSTRUCTION ***
                </div>
            </div>

            {/* Product Grid */}
            <section className="pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <a
                                key={product.id}
                                href={product.shortCode ? `/r/${product.shortCode}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="bg-[#C0C0C0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black p-1 hover:bg-[#dcdcdc] transition-colors">
                                    <div className="bg-[#000080] text-white px-2 py-0.5 font-bold text-xs flex justify-between items-center mb-1">
                                        <span>{product.name.substring(0, 20)}...</span>
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 bg-[#C0C0C0] border border-black"></div>
                                            <div className="w-3 h-3 bg-[#C0C0C0] border border-black"></div>
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-gray-500 p-2 mb-2">
                                        <div className="aspect-square bg-gray-100 overflow-hidden relative">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-100 cursor-crosshair"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-1 pb-1 text-center">
                                        <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                                        <div className="flex justify-center items-center gap-2 mb-2">
                                            <Star className="w-3 h-3 fill-yellow-400 text-black" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-black" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-black" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-black" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-black" />
                                        </div>
                                        <div className="text-red-600 font-bold bg-yellow-200 inline-block px-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#C0C0C0] border-t-2 border-white p-4 text-center text-xs font-bold">
                <p>Best viewed with Netscape Navigator 4.0</p>
                <div className="flex justify-center gap-2 mt-2">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Internet_Explorer_6_logo.png" alt="IE" className="h-8" />
                    <div className="h-8 bg-black text-yellow-400 flex items-center px-2 border-2 border-gray-500">
                        VISITOR: 001337
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default RetroPopStorefront;
