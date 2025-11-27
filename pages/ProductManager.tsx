import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { supabase } from '../services/storage/supabaseClient';

const ProductManager: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [showModal, setShowModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUserAndProducts();
    }, []);

    const fetchUserAndProducts = async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
                const fetchedProducts = await supabaseAdapter.getProducts(session.user.id);
                setProducts(fetchedProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userId || !currentProduct.name || !currentProduct.price) return;

        try {
            setLoading(true);

            if (isEditing && currentProduct.id) {
                await supabaseAdapter.updateProduct(currentProduct.id, currentProduct);
            } else {
                // Create a tracked link for the product first
                // For now, we'll just create a placeholder link. 
                // In a real app, we'd ask for the destination URL or use a default.
                const link = await supabaseAdapter.createLink({
                    originalUrl: 'https://example.com/checkout', // Placeholder
                    shortCode: `prod-${Date.now().toString(36)}`,
                    title: currentProduct.name,
                    tags: ['product'],
                    clicks: 0,
                    clickHistory: [],
                    createdAt: Date.now(),
                });

                await supabaseAdapter.createProduct({
                    userId,
                    name: currentProduct.name,
                    description: currentProduct.description || '',
                    price: Number(currentProduct.price),
                    currency: currentProduct.currency || 'USD',
                    imageUrl: currentProduct.imageUrl,
                    linkId: link.id,
                });
            }

            setShowModal(false);
            setCurrentProduct({});
            setIsEditing(false);
            fetchUserAndProducts();
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await supabaseAdapter.deleteProduct(id);
                fetchUserAndProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            setIsEditing(true);
        } else {
            setCurrentProduct({ currency: 'USD' });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    if (loading && !showModal) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Product Storefront</h1>
                    <p className="text-slate-400">Manage your products and track their performance.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all">
                        <div className="aspect-video bg-slate-800 relative">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(product)}
                                    className="p-2 bg-slate-900/80 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 bg-slate-900/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                                <span className="text-emerald-400 font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Package className="w-4 h-4" />
                                    <span>Physical Item</span>
                                </div>
                                <button className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                                    Analytics <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <Package className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-white mb-1">No products yet</p>
                        <p className="text-sm mb-4">Start selling by adding your first product.</p>
                        <button
                            onClick={() => openModal()}
                            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Product
                        </button>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {isEditing ? 'Edit Product' : 'New Product'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={currentProduct.name || ''}
                                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. Premium T-Shirt"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Price</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="number"
                                            value={currentProduct.price || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Currency</label>
                                    <select
                                        value={currentProduct.currency || 'USD'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, currency: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={currentProduct.description || ''}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                                    placeholder="Describe your product..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={currentProduct.imageUrl || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;
