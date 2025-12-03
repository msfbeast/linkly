import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Database, FileText, Filter } from 'lucide-react';
import { Product } from '@/types';

interface StorefrontTemplateProps {
    products: Product[];
    loading: boolean;
    storeProfile?: any;
}

const ArchiveStorefront: React.FC<StorefrontTemplateProps> = ({ products, loading, storeProfile }) => {
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
                <div className="font-mono text-xs animate-pulse">LOADING_ARCHIVE_DATA...</div>
            </div>
        );
    }

    const storeName = storeProfile?.storeName || 'ARCHIVE_DB_V2';
    const storeLogo = storeProfile?.storeLogoUrl;

    return (
        <div className="min-h-screen bg-[#F0F0F0] font-mono text-[#333] selection:bg-[#333] selection:text-[#F0F0F0]">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#F0F0F0] border-b border-[#CCC] h-12 flex items-center px-4 justify-between text-xs">
                <div className="flex items-center gap-2">
                    {storeLogo ? (
                        <img src={storeLogo} alt={storeName} className="w-3 h-3 object-cover grayscale" />
                    ) : (
                        <Database className="w-3 h-3" />
                    )}
                    <span className="font-bold uppercase">{storeName}</span>
                </div>
                <div className="hidden md:block text-[#666]">
                    / ROOT / COLLECTION / {new Date().getFullYear()}
                </div>
                <div className="flex items-center gap-4">
                    <button className="hover:underline">[ LOGIN ]</button>
                </div>
            </header>

            {/* Main Content */}
            <div className="pt-12 min-h-screen flex flex-col md:flex-row">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#CCC] bg-[#F0F0F0] p-4 md:fixed md:h-full md:top-12 md:left-0 overflow-y-auto z-40">
                    <div className="mb-8">
                        <h3 className="font-bold text-xs mb-4 flex items-center gap-2">
                            <Filter className="w-3 h-3" />
                            FILTERS
                        </h3>
                        <div className="space-y-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer hover:text-black">
                                <input type="checkbox" className="rounded-none border-[#999]" />
                                <span>AVAILABLE (12)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer hover:text-black">
                                <input type="checkbox" className="rounded-none border-[#999]" />
                                <span>ARCHIVED (45)</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-xs mb-4">CATEGORIES</h3>
                        <ul className="space-y-2 text-xs text-[#666]">
                            <li className="hover:text-black cursor-pointer">/ OBJECTS</li>
                            <li className="hover:text-black cursor-pointer">/ APPAREL</li>
                            <li className="hover:text-black cursor-pointer">/ PRINT</li>
                            <li className="hover:text-black cursor-pointer">/ DIGITAL</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-[#E5E5E5] text-[10px] leading-relaxed">
                        <p className="mb-2 font-bold">ABOUT THIS ARCHIVE</p>
                        <p>A digital repository of curated goods. Preserving design history through commerce.</p>
                    </div>
                </aside>

                {/* Product List */}
                <main className="flex-1 md:ml-64">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#CCC] text-[10px] font-bold text-[#666] sticky top-12 bg-[#F0F0F0] z-30">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-2">PREVIEW</div>
                        <div className="col-span-4">NAME</div>
                        <div className="col-span-2">CATEGORY</div>
                        <div className="col-span-2">PRICE</div>
                        <div className="col-span-1 text-right">ACTION</div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-[#CCC]">
                        {products.map((product, index) => (
                            <a
                                key={product.id}
                                href={product.shortCode ? `/r/${product.shortCode}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block hover:bg-white transition-colors"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                                    {/* Mobile Layout */}
                                    <div className="md:hidden flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold">{product.name}</span>
                                        <span className="text-xs">{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}</span>
                                    </div>

                                    {/* Desktop Columns */}
                                    <div className="hidden md:block col-span-1 text-xs text-[#999]">
                                        {String(index + 1).padStart(4, '0')}
                                    </div>

                                    <div className="col-span-12 md:col-span-2">
                                        <div className="w-full md:w-16 h-16 bg-[#E5E5E5] overflow-hidden border border-[#DDD]">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-[#999]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden md:block col-span-4 text-sm font-medium group-hover:underline decoration-1 underline-offset-4">
                                        {product.name}
                                        {product.description && (
                                            <p className="text-[10px] text-[#999] mt-1 truncate max-w-xs">{product.description}</p>
                                        )}
                                    </div>

                                    <div className="hidden md:block col-span-2 text-xs uppercase bg-[#E5E5E5] px-2 py-1 rounded w-fit">
                                        {product.category || 'Uncategorized'}
                                    </div>

                                    <div className="hidden md:block col-span-2 text-xs font-mono">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </div>

                                    <div className="col-span-12 md:col-span-1 text-right">
                                        <button className="w-full md:w-auto bg-[#333] text-white px-3 py-1 text-[10px] hover:bg-black transition-colors">
                                            VIEW
                                        </button>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ArchiveStorefront;
