import React from 'react';
import { Product } from '../../types';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface ProductGridProps {
    products: Product[];
    onProductClick?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick }) => {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white/5 border border-white/10 p-8">
                <div className="p-3 bg-stone-100 rounded-full mb-4">
                    <ShoppingBag className="w-6 h-6 text-stone-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No products yet</h3>
                <p className="text-sm text-stone-500">Check back later for new items.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
                <a
                    key={product.id}
                    href={product.originalUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                    onClick={(e) => {
                        if (onProductClick) {
                            e.preventDefault();
                            onProductClick(product);
                        }
                    }}
                >
                    {/* Image Area */}
                    <div className="aspect-square w-full bg-white relative overflow-hidden flex items-center justify-center p-4 group-hover:bg-stone-50 transition-colors duration-300">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <ShoppingBag className="w-12 h-12" />
                            </div>
                        )}

                        {/* Overlay Action */}
                        <div className="absolute inset-0 bg-black/0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            {/* Removed button to keep image clean, hover effect on card is enough */}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                                {product.name}
                            </h3>
                        </div>

                        <p className="text-stone-500 text-xs mb-4 line-clamp-2 flex-1">
                            {product.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100 dark:border-white/5">
                            <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                {product.currency} {product.price}
                            </div>
                            <div className="p-2 rounded-full bg-stone-50 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 dark:text-white/40 dark:group-hover:text-indigo-400" />
                            </div>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
};
