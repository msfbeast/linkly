import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Terminal, Cpu, Wifi } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: any;
}

const CyberpunkStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center font-mono">
                <div className="text-[#00ff00] animate-pulse">SYSTEM.LOADING...</div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'CYBER.MARKET_V2';
    const storeLogo = storeProfile?.storeLogoUrl;
    const storeBanner = storeProfile?.storeBannerUrl;

    return (
        <div className="min-h-screen bg-[#050505] text-[#00ff00] font-mono selection:bg-[#00ff00] selection:text-black overflow-x-hidden">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(to right, #00ff00 1px, transparent 1px), linear-gradient(to bottom, #00ff00 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}>
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-[#00ff00]/30 bg-black/90 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="w-8 h-8 rounded-none border border-[#00ff00] object-cover" />
                        ) : (
                            <Terminal className="w-5 h-5" />
                        )}
                        <span className="font-bold tracking-widest uppercase">{storeName}</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2 text-[#00ff00]/60">
                            <Wifi className="w-3 h-3 animate-pulse" />
                            <span>NET_CONNECTED</span>
                        </div>
                        <div className="border border-[#00ff00] px-3 py-1 hover:bg-[#00ff00] hover:text-black cursor-pointer transition-colors">
                            STATUS: ONLINE
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="border border-[#00ff00] p-8 md:p-10 relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
                        {storeBanner && (
                            <div className="absolute inset-0 z-0">
                                <img src={storeBanner} alt="Banner" className="w-full h-full object-cover opacity-30 grayscale mix-blend-screen" />
                                <div className="absolute inset-0 bg-[#050505]/80"></div>
                            </div>
                        )}

                        <div className="absolute top-0 left-0 w-2 h-2 bg-[#00ff00]"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff00]"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00ff00]"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff00]"></div>

                        <div className="absolute inset-0 bg-[#00ff00]/5 group-hover:bg-[#00ff00]/10 transition-colors pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="text-xs mb-4 text-[#ff00ff] animate-pulse">&gt;&gt; INCOMING_TRANSMISSION</div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tighter glitch-effect">
                                {storeName} <br />
                                <span className="text-white bg-[#00ff00]/20 px-2">System</span>
                            </h1>
                            <p className="text-[#00ff00]/70 max-w-xl mb-8 text-sm md:text-base">
                                Access high-grade tech components and enhancements. Authorized personnel only.
                            </p>
                            <button className="bg-[#00ff00] text-black px-8 py-3 font-bold uppercase hover:bg-[#ff00ff] hover:text-white transition-colors clip-path-polygon w-fit">
                                Initialize Access
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-12 border-b border-[#00ff00]/30 pb-4">
                        <Cpu className="w-5 h-5" />
                        <h2 className="text-xl font-bold uppercase">Inventory_Manifest</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, i) => (
                            <a
                                key={product.id}
                                href={product.shortCode ? `/r/${product.shortCode}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block bg-black border border-[#00ff00] p-4 relative overflow-hidden hover:shadow-[0_0_20px_rgba(0,255,0,0.5)] transition-all duration-300"
                            >
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-[#00ff00] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="aspect-video bg-[#00ff00]/5 border-b border-[#00ff00]/30 relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-2 grayscale group-hover:grayscale-0 transition-all duration-300 mix-blend-screen"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black border border-[#00ff00] px-2 py-0.5 text-xs">
                                        ID: {product.id.substring(0, 4)}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg uppercase truncate pr-4">{product.name}</h3>
                                        <span className="text-[#ff00ff] font-bold">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#00ff00]/60 line-clamp-2 mb-4 font-sans">
                                        {product.description}
                                    </p>
                                    <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                                        <span className="bg-[#00ff00]/10 px-2 py-1">{product.category || 'MISC'}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">&gt;&gt; ACQUIRE</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CyberpunkStorefront;
