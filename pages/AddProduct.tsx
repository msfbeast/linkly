import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Zap, DollarSign, Image as ImageIcon, Loader2, Save, ArrowLeft, ExternalLink, Sparkles, Link as LinkIcon, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { extractProductMetadata } from '../services/extractionService';
import { toast } from 'sonner';
import { Product } from '../types';

const AddProduct: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Form State
    const [product, setProduct] = useState<Partial<Product>>({
        currency: 'USD',
        type: 'physical',
        salesCount: 0
    });
    const [destinationUrl, setDestinationUrl] = useState('');

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
            const details = await extractProductMetadata(importUrl);
            if (!details) {
                toast.error('Could not extract details automatically');
                return;
            }

            setProduct(prev => ({
                ...prev,
                name: details.title,
                price: details.price,
                currency: details.currency,
                imageUrl: details.images[0],
                description: details.description,
                originalUrl: importUrl
            }));
            setDestinationUrl(importUrl); // Set destination URL for physical products
            toast.success('Product details auto-filled!');
        } catch (error) {
            console.error('Auto-fill error:', error);
            toast.error('Failed to auto-fill details');
        } finally {
            setIsImporting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user?.id) return;
        setUploadingFile(true);
        try {
            const file = e.target.files[0];
            const path = await supabaseAdapter.uploadDigitalFile(file, user.id);
            setProduct(prev => ({
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

    const handleSave = async () => {
        if (!user?.id) return;
        if (!product.name || !product.price) {
            toast.error('Please fill in Name and Price');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                ...product,
                userId: user.id,
                salesCount: product.salesCount || 0,
                // Logic for physical vs digital
                linkId: (product.type !== 'digital' && destinationUrl) ? (await supabaseAdapter.createLink({
                    originalUrl: destinationUrl,
                    shortCode: Math.random().toString(36).substring(7),
                    title: product.name || 'Product Link',
                    clicks: 0,
                    createdAt: Date.now(),
                    tags: ['product'],
                    clickHistory: []
                })).id : undefined
            };

            await supabaseAdapter.createProduct(productData as any);
            toast.success('Product created successfully');
            navigate('/dashboard/products');
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6 pb-24">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard/products')}
                        className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
                        <p className="text-stone-500">Create a digital or physical product for your store.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input & Type */}
                    <div className="space-y-6">
                        {/* Auto-fill Card */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
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
                                    className="w-full bg-white border-2 border-yellow-400/30 group-hover:border-yellow-400/50 focus:border-yellow-400 rounded-2xl pl-4 pr-12 py-3 text-slate-900 text-sm placeholder:text-stone-300 focus:outline-none transition-all"
                                    placeholder="Paste URL..."
                                />
                                <button
                                    onClick={handleAutoFill}
                                    disabled={isImporting || !importUrl}
                                    className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-white px-3 rounded-xl text-xs font-bold btn-premium disabled:opacity-50"
                                >
                                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                                </button>
                            </div>
                            <p className="text-xs text-stone-500 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Fetches title, price, and images.
                            </p>
                        </div>

                        {/* Image Preview */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-4">Product Image</label>
                            <div className="aspect-square bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-yellow-400 transition-colors">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain p-4"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-stone-300 group-hover:text-yellow-400 transition-colors" />
                                )}
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={product.imageUrl || ''}
                                    onChange={e => setProduct({ ...product, imageUrl: e.target.value })}
                                    className="w-full input-premium px-3 py-2 text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-stone-200 rounded-[2rem] p-8 shadow-sm">
                            {/* Type Selector */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => setProduct({ ...product, type: 'physical' })}
                                    className={`py-3 rounded-xl border-2 font-bold text-sm btn-premium flex items-center justify-center gap-2 ${product.type !== 'digital'
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                        : 'border-stone-100 bg-white text-stone-500 hover:border-slate-200'
                                        }`}
                                >
                                    <Package className="w-4 h-4" />
                                    Physical Item
                                </button>
                                <button
                                    onClick={() => setProduct({ ...product, type: 'digital' })}
                                    className={`py-3 rounded-xl border-2 font-bold text-sm btn-premium flex items-center justify-center gap-2 ${product.type === 'digital'
                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'border-stone-100 bg-white text-stone-500 hover:border-slate-200'
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Digital Asset
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Conditional Logic */}
                                {product.type === 'digital' ? (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Upload File</label>
                                        <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:bg-stone-50 transition-colors relative">
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                disabled={uploadingFile}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            {uploadingFile ? (
                                                <Loader2 className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-2" />
                                            ) : product.fileName ? (
                                                <div className="flex flex-col items-center text-emerald-600">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                                                        <Upload className="w-6 h-6 text-emerald-600" />
                                                    </div>
                                                    <span className="font-bold">{product.fileName}</span>
                                                    <span className="text-xs text-stone-400 mt-1">Click to replace</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-stone-400">
                                                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-2">
                                                        <Upload className="w-6 h-6 text-stone-400" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">Upload Digital File</span>
                                                    <span className="text-sm mt-1">PDF, E-pub, Zip (Max 50MB)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Destination URL</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="url"
                                                value={destinationUrl}
                                                onChange={e => setDestinationUrl(e.target.value)}
                                                className="w-full input-premium pl-10 pr-4 py-3"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400 mt-2 ml-1">Redirect users here after "purchase" (for affiliate/physical).</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
                                    <input
                                        type="text"
                                        value={product.name || ''}
                                        onChange={e => setProduct({ ...product, name: e.target.value })}
                                        className="w-full input-premium px-4 py-3 text-lg font-bold placeholder:font-normal"
                                        placeholder="e.g. Design System Kit"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Price</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</div>
                                            <input
                                                type="number"
                                                value={product.price || ''}
                                                onChange={e => setProduct({ ...product, price: Number(e.target.value) })}
                                                className="w-full input-premium pl-8 pr-4 py-3 font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Currency</label>
                                        <select
                                            value={product.currency}
                                            onChange={e => setProduct({ ...product, currency: e.target.value })}
                                            className="w-full input-premium px-4 py-3 font-bold"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR">INR (₹)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={product.description || ''}
                                        onChange={e => setProduct({ ...product, description: e.target.value })}
                                        className="w-full input-premium px-4 py-3 min-h-[120px] resize-none"
                                        placeholder="Describe your product..."
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end gap-3">
                                <button
                                    onClick={() => navigate('/dashboard/products')}
                                    className="px-6 py-3 rounded-xl text-stone-500 font-bold hover:bg-stone-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-slate-900/20 btn-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Create Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
