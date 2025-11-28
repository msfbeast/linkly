import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Beaker, Activity, Plus } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
}

const LabStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Activity className="w-8 h-8 text-black animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-mono text-black selection:bg-black selection:text-white">
            {/* Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundImage: 'radial-gradient(#E5E5E5 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            ></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur border-b border-black">
                <div className="flex justify-between items-stretch h-14">
                    <div className="flex items-center px-6 border-r border-black bg-black text-white">
                        <Beaker className="w-5 h-5 mr-2" />
                        <span className="font-bold tracking-tighter">LAB.SYS</span>
                    </div>

                    <div className="flex-1 flex items-center px-6 text-xs overflow-hidden whitespace-nowrap">
                        <span className="mr-8">STATUS: OPERATIONAL</span>
                        <span className="mr-8">TEMP: 21°C</span>
                        <span className="mr-8">HUMIDITY: 45%</span>
                        <span className="animate-pulse text-green-600">● LIVE</span>
                    </div>

                    <button className="flex items-center px-6 border-l border-black hover:bg-gray-100 transition-colors">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold">CART [0]</span>
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
                <div className="border border-black p-8 md:p-16 bg-white relative">
                    <div className="absolute top-0 left-0 bg-black text-white text-[10px] px-2 py-1">FIG. 01</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                                FORMULA <br />
                                FOR FUTURE.
                            </h1>
                            <p className="text-sm text-gray-600 mb-8 max-w-md">
                                Experimental design meets rigorous testing. Our products are engineered to perform under any condition.
                            </p>
                            <div className="flex gap-4">
                                <button className="bg-black text-white px-6 py-3 text-xs font-bold hover:bg-gray-800 transition-colors">
                                    INITIATE SEQUENCE
                                </button>
                            </div>
                        </div>
                        <div className="h-64 border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <span className="text-xs text-gray-400">NO DATA VISUALIZATION</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8 border-b border-black pb-2">
                        <h2 className="text-sm font-bold uppercase">Specimens</h2>
                        <span className="text-xs">N = {products.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black border border-black">
                        {products.map((product, index) => (
                            <Link
                                key={product.id}
                                to={`/store/product/${product.id}`}
                                className="group bg-white p-6 hover:bg-gray-50 transition-colors relative"
                            >
                                <div className="absolute top-4 right-4 text-[10px] text-gray-400">
                                    #{String(index + 1).padStart(3, '0')}
                                </div>

                                <div className="aspect-square bg-gray-100 mb-6 flex items-center justify-center overflow-hidden relative">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <Plus className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-sm leading-tight max-w-[70%]">{product.name}</h3>
                                        <span className="text-sm font-bold">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] text-gray-500 uppercase">
                                        <span className="border border-gray-200 px-1 rounded">{product.category || 'Unknown'}</span>
                                        <span className="border border-gray-200 px-1 rounded">In Stock</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-black bg-white py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
                    <div>
                        <div className="flex items-center mb-4">
                            <Beaker className="w-4 h-4 mr-2" />
                            <span className="font-bold text-sm">LAB.SYS</span>
                        </div>
                        <p className="text-xs text-gray-500 max-w-xs">
                            All products tested in accordance with ISO 9001 standards. <br />
                            © 2025 Laboratory Systems Inc.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-12 text-xs">
                        <div>
                            <h4 className="font-bold mb-4">DATA</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><a href="#" className="hover:text-black">Research</a></li>
                                <li><a href="#" className="hover:text-black">Methodology</a></li>
                                <li><a href="#" className="hover:text-black">Results</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">ACCESS</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><a href="#" className="hover:text-black">Login</a></li>
                                <li><a href="#" className="hover:text-black">Request Invite</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LabStorefront;
