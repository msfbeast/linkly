import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Star, Zap, ExternalLink, X, DollarSign } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Product, UserProfile } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: UserProfile | null;
}

const VibrantStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FF3366] flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-300 animate-spin"></div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'POP!';
    const storeLogo = storeProfile?.storeLogoUrl;
    const storeBanner = storeProfile?.storeBannerUrl;

    const handleVisit = (product: Product) => {
        if (product.originalUrl) {
            window.open(product.originalUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F0F0] text-slate-900 font-sans selection:bg-[#FF3366] selection:text-white overflow-x-hidden">
            {/* Vibrant Header */}
            <header className="fixed top-4 left-4 right-4 z-50">
                <div className="bg-white/80 backdrop-blur-md border-2 border-black rounded-full px-6 py-3 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                        {storeLogo ? (
                            <img src={storeLogo} alt={storeName} className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                        ) : (
                            <div className="w-8 h-8 bg-[#FF3366] rounded-full border-2 border-black flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white fill-current" />
                            </div>
                        )}
                        <span className="font-black text-xl tracking-tighter italic uppercase">{storeName}</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-wide">
                        <a href="#" className="hover:text-[#FF3366] transition-colors">New</a>
                        <a href="#" className="hover:text-[#FF3366] transition-colors">Trending</a>
                        <a href="#" className="hover:text-[#FF3366] transition-colors">Sale</a>
                    </nav>

                    <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-yellow-300 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-full border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
                    >
                        <Star className="w-4 h-4" />
                        <span>Follow Us</span>
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-[#6B46C1] rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[400px] flex flex-col justify-center items-center">
                        {storeBanner && (
                            <div className="absolute inset-0 z-0">
                                <img src={storeBanner} alt="Banner" className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#6B46C1] via-transparent to-transparent opacity-80"></div>
                            </div>
                        )}

                        {/* Decorative Shapes */}
                        <div className="absolute top-10 left-10 w-20 h-20 bg-[#FF3366] rounded-full border-4 border-black z-10"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-300 rotate-12 border-4 border-black z-10"></div>
                        <div className="absolute top-1/2 right-20 w-16 h-16 bg-cyan-400 rounded-full border-4 border-black z-10"></div>

                        <div className="relative z-20">
                            <div className="inline-block bg-white border-2 border-black px-4 py-1 rounded-full font-black uppercase tracking-widest text-xs mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
                                Fresh Drop
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white mb-8 leading-none tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase">
                                {storeName}
                            </h1>
                            <p className="text-white font-bold text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md">
                                Stand out from the crowd with our boldest collection yet. Colors that pop, styles that rock.
                            </p>
                            <button className="bg-[#FF3366] text-white px-10 py-4 rounded-full font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                SHOP THE DROP
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee */}
            <div className="bg-yellow-300 border-y-4 border-black py-3 overflow-hidden whitespace-nowrap">
                <div className="inline-flex animate-marquee">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-2xl font-black uppercase mx-8 flex items-center gap-4">
                            New Arrivals <Star className="w-6 h-6 fill-black" />
                        </span>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product, i) => (
                            <div
                                key={product.id}
                                className={`group bg-white rounded-[2rem] border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 flex flex-col`}
                            >
                                <Link to={`/store/product/${product.id}`} className="block aspect-square bg-white rounded-[1.5rem] mb-4 overflow-hidden relative border-2 border-black">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white">
                                            <ShoppingBag className="w-12 h-12 text-black" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-yellow-300 px-3 py-1 rounded-full border-2 border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </div>
                                </Link>

                                <div className="px-2 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight line-clamp-2">{product.name}</h3>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className="text-sm font-bold text-gray-500 uppercase">{product.category || 'Cool Stuff'}</span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleVisit(product);
                                            }}
                                            className="h-10 px-4 bg-[#FF3366] rounded-full border-2 border-black flex items-center gap-2 text-white font-bold hover:bg-black hover:text-white transition-colors"
                                        >
                                            <span>Visit Site</span>
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white pt-20 pb-10 px-4 mt-20">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-[12vw] font-black leading-none mb-10 text-transparent stroke-white stroke-2 uppercase" style={{ WebkitTextStroke: '2px white' }}>
                        {storeName}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-6 mb-10">
                        {['Instagram', 'TikTok', 'Twitter', 'Discord'].map((social) => (
                            <a key={social} href="#" className="text-xl font-bold hover:text-yellow-300 transition-colors uppercase">
                                {social}
                            </a>
                        ))}
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                        © {new Date().getFullYear()} {storeName}. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default VibrantStorefront;
