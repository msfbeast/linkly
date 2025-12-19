import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Package, DollarSign, Image as ImageIcon, Link as LinkIcon, Loader2, Zap, Sparkles, ShoppingBag } from 'lucide-react';
import OrdersList from '../app/components/OrdersList';
import { Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { toast } from 'sonner';
import { supabase } from '../services/storage/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { monetizeUrl } from '../utils/affiliateUtils';

import { extractProductDetails } from '../services/geminiService';
import { extractProductMetadata } from '../services/extractionService';

import { useNavigate } from 'react-router-dom';

const ProductManager: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
    const [showModal, setShowModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [destinationUrl, setDestinationUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

    const [storeSettings, setStoreSettings] = useState({
        storeName: '',
        storeLogoUrl: '',
        storeBannerUrl: '',
        upiId: '',
        flipkartAffiliateId: '',
        amazonAssociateTag: '',
    });

    useEffect(() => {
        if (user) {
            setStoreSettings({
                storeName: user.storeName || '',
                storeLogoUrl: user.storeLogoUrl || '',
                storeBannerUrl: user.storeBannerUrl || '',
                upiId: user.upiId || '',
                flipkartAffiliateId: user.flipkartAffiliateId || '',
                amazonAssociateTag: user.amazonAssociateTag || '',
            });
        }
    }, [user]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await updateProfile(storeSettings);
            toast.success('Store settings saved successfully!');
            setShowSettingsModal(false);
        } catch (error) {
            console.error('Error saving store settings:', error);
            toast.error('Failed to save store settings.');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const getAffiliateConfig = () => ({
        flipkartAffiliateId: user?.flipkartAffiliateId,
        amazonAssociateTag: user?.amazonAssociateTag,
    });

    const fetchProducts = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await supabaseAdapter.getProducts(user.id);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);



    const handleAutoFill = async () => {
        // Gate Access (Pro Tier+)
        const tier = user?.preferences?.subscription_tier;
        const isFree = !tier || tier === 'free';
        if (isFree) {
            toast.error("Auto-fill is a Pro feature. Please upgrade to use.");
            return;
        }

        if (!importUrl) return;
        setIsImporting(true);
        try {
            // 2. Use Mock Extraction Service (Phase 2 MVP)
            const details = await extractProductMetadata(importUrl);

            if (!details) {
                toast.error('Could not extract details automatically');
                return;
            }

            setCurrentProduct(prev => ({
                ...prev,
                name: details.title, // Map title -> name
                price: details.price,
                currency: details.currency,
                imageUrl: details.images[0], // Take first image
                description: details.description,
                originalUrl: importUrl
            }));
            toast.success('Product details auto-filled!');
        } catch (error) {
            console.error('Auto-fill error:', error);
            toast.error('Failed to auto-fill details');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const productData = {
                ...currentProduct,
                userId: user.id,
                // linkId logic moved below to handle Digital types
                type: currentProduct.type || 'physical',
                fileUrl: currentProduct.fileUrl,
                fileName: currentProduct.fileName,
                salesCount: currentProduct.salesCount || 0,
                // If it's physical, we might need a link. If digital, we might not need a tracked link immediately or we use a different mechanism.
                // For now, let's keep the link creation logic but only if destinationUrl is present (Physical).
                linkId: (currentProduct.type !== 'digital' && destinationUrl) ? (await supabaseAdapter.createLink({
                    originalUrl: destinationUrl,
                    shortCode: Math.random().toString(36).substring(7),
                    title: currentProduct.name || 'Product Link',
                    clicks: 0,
                    createdAt: Date.now(),
                    tags: ['product'],
                    clickHistory: []
                })).id : (currentProduct.linkId || null)
            };

            if (isEditing && currentProduct.id) {
                await supabaseAdapter.updateProduct(currentProduct.id, productData);
                toast.success('Product updated successfully');
            } else {
                await supabaseAdapter.createProduct(productData as any);
                toast.success('Product created successfully');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await supabaseAdapter.deleteProduct(id);
            toast.success('Product deleted');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            setIsEditing(true);
            setDestinationUrl(product.originalUrl || '');
        } else {
            setCurrentProduct({
                currency: 'USD',
                type: 'physical'
            });
            setIsEditing(false);
            setDestinationUrl('');
            setImportUrl('');
        }
        setShowModal(true);
    };

    // Mock existing links for now or fetch them
    const existingLinks: any[] = [];
    const handleLinkSelect = (link: any) => {
        setDestinationUrl(link.originalUrl);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user?.id) return;
        setUploadingFile(true);
        try {
            const file = e.target.files[0];
            const path = await supabaseAdapter.uploadDigitalFile(file, user.id);
            setCurrentProduct(prev => ({
                ...prev,
                fileUrl: path,
                fileName: file.name
            }));
            toast.success('File uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('File upload failed');
        } finally {
            setUploadingFile(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Storefront</h1>
                    <p className="text-stone-500">Manage your products and track their performance.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="bg-white border border-stone-200 hover:border-yellow-400 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Zap className="w-4 h-4" />
                        Store Settings
                    </button>
                    <a
                        href={`/store/${user?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-white border border-stone-200 hover:border-yellow-400 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${!user?.id ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Storefront
                    </a>
                    <button
                        onClick={() => {
                            const isFree = !user?.preferences?.subscription_tier || user.preferences.subscription_tier === 'free';
                            if (isFree) {
                                toast.error("Digital Storefront is a Pro feature. Please upgrade to sell products.");
                            } else {
                                navigate('/dashboard/products/add');
                            }
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-bold shadow-sm shadow-yellow-400/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'products' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Products
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'orders' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Orders
                </button>
            </div>

            {activeTab === 'orders' ? (
                <OrdersList sellerId={user?.id} products={products} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden group hover:shadow-md transition-all flex flex-col h-full">
                            <div className="h-64 w-full bg-stone-100 relative overflow-hidden shrink-0">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
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

                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(product.price)}
                                    </span>
                                </div>
                                <p className="text-stone-500 text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
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
                                onClick={() => navigate('/dashboard/products/add')}
                                className="text-yellow-600 hover:text-yellow-700 font-bold flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create Product
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Store Settings Modal */}
            {
                showSettingsModal && (
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Store Settings</h2>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-slate-900"
                                >
                                    <ExternalLink className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Store Name</label>
                                    <input
                                        type="text"
                                        value={storeSettings.storeName}
                                        onChange={e => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                        placeholder="My Awesome Store"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Store Logo URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="text"
                                                value={storeSettings.storeLogoUrl}
                                                onChange={e => setStoreSettings({ ...storeSettings, storeLogoUrl: e.target.value })}
                                                className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Store Banner URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="text"
                                                value={storeSettings.storeBannerUrl}
                                                onChange={e => setStoreSettings({ ...storeSettings, storeBannerUrl: e.target.value })}
                                                className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="pt-6 border-t border-stone-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Settings</h3>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">UPI ID (VPA)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input
                                            type="text"
                                            value={storeSettings.upiId}
                                            onChange={e => setStoreSettings({ ...storeSettings, upiId: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                            placeholder="merchant@okicici"
                                        />
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">Accept payments directly via UPI apps.</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-stone-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Affiliate Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Amazon Associate Tag</label>
                                        <input
                                            type="text"
                                            value={storeSettings.amazonAssociateTag}
                                            onChange={e => setStoreSettings({ ...storeSettings, amazonAssociateTag: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                            placeholder="tag-21"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Flipkart Affiliate ID</label>
                                        <input
                                            type="text"
                                            value={storeSettings.flipkartAffiliateId}
                                            onChange={e => setStoreSettings({ ...storeSettings, flipkartAffiliateId: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                                            placeholder="affid"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 text-stone-500 hover:text-slate-900 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSavingSettings}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                >
                                    {isSavingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit/Create Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-5xl p-8 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {isEditing ? 'Edit Product' : 'New Product'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-slate-900"
                                >
                                    <ExternalLink className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column: Auto-fill & Recent Links */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-100 shadow-sm relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                        <div className="relative z-10">
                                            <label className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                                                <div className="p-1.5 bg-yellow-400 rounded-lg text-slate-900 shadow-sm">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                Magic Auto-fill
                                            </label>

                                            <div className="relative group mb-4">
                                                <input
                                                    type="url"
                                                    value={importUrl}
                                                    onChange={e => setImportUrl(e.target.value)}
                                                    className="w-full bg-white border-2 border-yellow-400/30 group-hover:border-yellow-400/50 focus:border-yellow-400 rounded-2xl pl-4 pr-32 py-3 text-slate-900 text-base placeholder:text-stone-300 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all shadow-sm"
                                                    placeholder="Paste product link..."
                                                />
                                                <div className="absolute right-1.5 top-1.5 bottom-1.5">
                                                    <button
                                                        onClick={handleAutoFill}
                                                        disabled={isImporting || !importUrl}
                                                        className="h-full bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                                    >
                                                        {isImporting ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <span>Auto-fill</span>
                                                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-xs font-medium text-stone-500 mb-6 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                                AI fetches name, price, and image.
                                            </p>

                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                                                    Recent Links
                                                </label>

                                                <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                                    {existingLinks.length > 0 ? (
                                                        existingLinks.slice(0, 4).map(link => (
                                                            <button
                                                                key={link.id}
                                                                onClick={() => handleLinkSelect(link)}
                                                                className="w-full bg-white/60 hover:bg-white border border-stone-200 hover:border-yellow-400 rounded-xl p-3 text-left transition-all group shadow-sm hover:shadow-md flex items-center gap-3"
                                                            >
                                                                <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-yellow-100 transition-colors shrink-0">
                                                                    <LinkIcon className="w-4 h-4 text-stone-500 group-hover:text-yellow-600" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-yellow-700 transition-colors">
                                                                        {link.title}
                                                                    </h4>
                                                                    <p className="text-xs text-stone-400 truncate">
                                                                        {link.originalUrl}
                                                                    </p>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-md border border-stone-100 shrink-0">
                                                                    {link.clicks}
                                                                </span>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-4 text-xs text-stone-400 italic">
                                                            No recent links found.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Image Preview */}
                                                {currentProduct.imageUrl && (
                                                    <div className="mt-6 pt-6 border-t border-yellow-400/20">
                                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-3">
                                                            Fetched Preview
                                                        </label>
                                                        <div className="relative rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white aspect-square w-full group">
                                                            <img
                                                                src={currentProduct.imageUrl}
                                                                alt="Preview"
                                                                className="w-full h-full object-contain p-4"
                                                                referrerPolicy="no-referrer"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {currentProduct.currency} {currentProduct.price}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Form */}
                                <div className="lg:col-span-7 flex flex-col h-full">
                                    <div className="space-y-4 flex-1">

                                        {/* Type Selector */}
                                        <div className="flex gap-4 p-1 bg-stone-100 rounded-xl mb-4">
                                            <button
                                                onClick={() => setCurrentProduct({ ...currentProduct, type: 'physical' })}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${currentProduct.type !== 'digital' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-900'}`}
                                            >
                                                <Package className="w-4 h-4" />
                                                Physical Item
                                            </button>
                                            <button
                                                onClick={() => setCurrentProduct({ ...currentProduct, type: 'digital' })}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${currentProduct.type === 'digital' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-500 hover:text-slate-900'}`}
                                            >
                                                <Zap className="w-4 h-4" />
                                                Digital Asset
                                            </button>
                                        </div>

                                        {currentProduct.type === 'digital' ? (
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Upload File (PDF, E-book, etc.)</label>
                                                <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors relative">
                                                    <input
                                                        type="file"
                                                        onChange={handleFileUpload}
                                                        disabled={uploadingFile}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    {uploadingFile ? (
                                                        <Loader2 className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-2" />
                                                    ) : currentProduct.fileName ? (
                                                        <div className="flex flex-col items-center text-emerald-600">
                                                            <Package className="w-8 h-8 mb-2" />
                                                            <span className="font-bold">{currentProduct.fileName}</span>
                                                            <span className="text-xs text-stone-400 mt-1">Click to replace</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-stone-400">
                                                            <Package className="w-8 h-8 mb-2" />
                                                            <span className="font-medium text-sm">Drop your file here or click to browse</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
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
                                        )}

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
                                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 h-20 resize-none transition-all"
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

                                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stone-100">
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
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProductManager;
