import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, Loader2, Zap } from 'lucide-react';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { supabase } from '../services/storage/supabaseClient';

import { extractProductDetails } from '../services/geminiService';

const ProductManager: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [showModal, setShowModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [importUrl, setImportUrl] = useState('');
    const [destinationUrl, setDestinationUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleAutoFill = async () => {
        if (!importUrl) return;
        setIsImporting(true);
        setDestinationUrl(importUrl); // Auto-set destination URL

        try {
            const details = await extractProductDetails(importUrl);

            if (details) {
                setCurrentProduct(prev => ({
                    ...prev,
                    name: details.name || prev.name,
                    description: details.description || prev.description,
                    price: details.price || prev.price,
                    currency: details.currency || prev.currency,
                    imageUrl: details.imageUrl || prev.imageUrl,
                }));
            } else {
                throw new Error('Could not extract product details.');
            }
        } catch (error: any) {
            console.error('Error auto-filling product:', error);
            alert('Failed to fetch product details. Please enter them manually.');
        } finally {
            setIsImporting(false);
        }
    };

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

    const [showLinkPicker, setShowLinkPicker] = useState(false);
    const [existingLinks, setExistingLinks] = useState<any[]>([]);
    const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

    const fetchLinks = async () => {
        try {
            const links = await supabaseAdapter.getLinks();
            setExistingLinks(links);
            setShowLinkPicker(true);
        } catch (error) {
            console.error('Error fetching links:', error);
            alert('Failed to load your links.');
        }
    };

    const handleLinkSelect = (link: any) => {
        setSelectedLinkId(link.id);
        setDestinationUrl(link.originalUrl);
        setCurrentProduct(prev => ({
            ...prev,
            name: link.title || prev.name,
            // Try to guess price/currency if tags have it? No, just keep it simple.
        }));

        // If the link has a URL, we can try to auto-fill from it too!
        if (link.originalUrl) {
            setImportUrl(link.originalUrl);
            // Optional: trigger auto-fill automatically? Maybe let user decide.
        }

        setShowLinkPicker(false);
    };

    const handleSave = async () => {
        if (!userId) return;

        if (!currentProduct.name || !currentProduct.price) {
            alert('Please fill in the Product Name and Price.');
            return;
        }

        try {
            setLoading(true);

            if (isEditing && currentProduct.id) {
                await supabaseAdapter.updateProduct(currentProduct.id, currentProduct);
            } else {
                let linkId = selectedLinkId;

                if (!linkId) {
                    // Create a new tracked link if one wasn't selected
                    const link = await supabaseAdapter.createLink({
                        originalUrl: destinationUrl || 'https://example.com',
                        shortCode: `prod-${Date.now().toString(36)}`,
                        title: currentProduct.name,
                        tags: ['product'],
                        clicks: 0,
                        clickHistory: [],
                        createdAt: Date.now(),
                    });
                    linkId = link.id;
                }

                await supabaseAdapter.createProduct({
                    userId,
                    name: currentProduct.name,
                    description: currentProduct.description || '',
                    price: Number(currentProduct.price),
                    currency: currentProduct.currency || 'USD',
                    imageUrl: currentProduct.imageUrl,
                    linkId: linkId,
                });
            }

            setShowModal(false);
            setCurrentProduct({});
            setDestinationUrl('');
            setSelectedLinkId(null);
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
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#FDFBF7]">
            {/* Link Picker Modal */}
            {showLinkPicker && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Select an Existing Link</h2>
                            <button onClick={() => setShowLinkPicker(false)} className="text-stone-400 hover:text-slate-900 transition-colors">
                                <ExternalLink className="w-5 h-5 rotate-45" /> {/* Close icon substitute */}
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                            {existingLinks.map(link => (
                                <button
                                    key={link.id}
                                    onClick={() => handleLinkSelect(link)}
                                    className="w-full text-left p-4 rounded-xl bg-stone-50 border border-stone-200 hover:border-yellow-400 hover:bg-white transition-all group shadow-sm"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-yellow-600 transition-colors">{link.title}</h3>
                                            <p className="text-xs text-stone-500 mt-1 truncate max-w-md">{link.originalUrl}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-500 bg-white px-2 py-1 rounded-lg border border-stone-200">
                                            <LinkIcon className="w-3 h-3" />
                                            {link.clicks} clicks
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Storefront</h1>
                    <p className="text-stone-500">Manage your products and track their performance.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href={`/store/${userId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-white border border-stone-200 hover:border-yellow-400 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${!userId ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Storefront
                    </a>
                    <button
                        onClick={() => openModal()}
                        className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-bold shadow-sm shadow-yellow-400/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden group hover:shadow-md transition-all">
                        <div className="aspect-video bg-stone-100 relative">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-300">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(product)}
                                    className="p-2 bg-white/90 text-slate-900 rounded-lg hover:bg-yellow-400 transition-colors shadow-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 bg-white/90 text-slate-900 rounded-lg hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                </span>
                            </div>
                            <p className="text-stone-500 text-sm mb-4 line-clamp-2">{product.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                                <div className="flex items-center gap-2 text-stone-400 text-sm">
                                    <Package className="w-4 h-4" />
                                    <span>Physical Item</span>
                                </div>
                                <button className="text-yellow-600 hover:text-yellow-700 text-sm font-bold flex items-center gap-1">
                                    Analytics <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-stone-400 border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/50">
                        <Package className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-bold text-slate-900 mb-1">No products yet</p>
                        <p className="text-sm mb-4">Start selling by adding your first product.</p>
                        <button
                            onClick={() => openModal()}
                            className="text-yellow-600 hover:text-yellow-700 font-bold flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Product
                        </button>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">
                            {isEditing ? 'Edit Product' : 'New Product'}
                        </h2>

                        <div className="space-y-5">
                            {/* Auto-fill Section */}
                            <div className="bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100 mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Auto-fill
                                    </label>
                                    {!isEditing && (
                                        <button
                                            onClick={fetchLinks}
                                            className="text-xs text-stone-500 hover:text-slate-900 flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded-lg transition-colors shadow-sm"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            Import from Link
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={importUrl}
                                        onChange={e => setImportUrl(e.target.value)}
                                        className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 placeholder-stone-400"
                                        placeholder="Paste product link here..."
                                    />
                                    <button
                                        onClick={handleAutoFill}
                                        disabled={isImporting || !importUrl}
                                        className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-yellow-400/20"
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                AI Agent working...
                                            </>
                                        ) : (
                                            'Auto-fill with AI'
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-stone-500 mt-2">
                                    We'll try to fetch the name, image, and description automatically.
                                </p>
                                {selectedLinkId && (
                                    <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                        <LinkIcon className="w-3 h-3" />
                                        Linked to existing tracking link
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-stone-100 pt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Destination URL</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            type="url"
                                            value={destinationUrl}
                                            onChange={e => setDestinationUrl(e.target.value)}
                                            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                            placeholder="https://amazon.com/..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        value={currentProduct.name || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                        placeholder="e.g. Premium T-Shirt"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Price</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            type="number"
                                            value={currentProduct.price || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                                    <select
                                        value={currentProduct.currency || 'USD'}
                                        onChange={e => setCurrentProduct({ ...currentProduct, currency: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all appearance-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={currentProduct.description || ''}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 h-24 resize-none transition-all"
                                    placeholder="Describe your product..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input
                                        type="text"
                                        value={currentProduct.imageUrl || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-stone-500 hover:text-slate-900 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/20"
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
