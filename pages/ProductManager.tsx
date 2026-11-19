import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, GripVertical, ImageIcon, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BioProfile, Product } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { addProductFromUrl, createProductLink, prepareDestination } from '../services/productQuickAdd';
import { MAX_BULK_URLS, parseUrlList, sortProducts } from '../utils/productList';
import { productCategories, storeLook } from '../utils/storePage';
import { formatPrice } from '../utils/formatPrice';
import { safeWebUrl } from '../utils/safeUrl';
import { aggregatedAnalytics, ProductAnalytics } from '../services/aggregatedAnalyticsService';
import ProductStats, { ProductStatRange } from '../components/dashboard/ProductStats';
import { ErrorBoundary } from '../components/ErrorBoundary';

/**
 * Products: paste a seller's link (or several) to add products to the
 * store page, then arrange, categorise and edit them.
 */

const tile = 'rounded-3xl bg-[#FBFAF8]';
const softButton = 'flex h-10 items-center justify-center gap-2 rounded-full bg-[#F0EEEA] px-4 text-[13px] font-medium text-[#4A4843] transition-colors hover:bg-[#E6E3DD] hover:text-[#18181A] disabled:opacity-50';
const darkButton = 'flex h-10 items-center justify-center gap-2 rounded-full bg-[#18181A] px-5 text-[13px] font-semibold text-[#F2F1EE] transition-colors hover:bg-[#2B2B2E] disabled:cursor-not-allowed disabled:opacity-40';
const field = 'w-full rounded-2xl border border-[#E6E3DD] bg-white px-3.5 py-2.5 text-[14px] text-[#18181A] placeholder:text-[#A19E97] focus:border-[#18181A] focus:outline-none focus:ring-0';
const label = 'mb-1.5 block text-[12px] font-medium text-[#8C8981]';

const ProductManager: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [bioProfile, setBioProfile] = useState<BioProfile | null>(null);
    const [tab, setTab] = useState<'products' | 'orders'>('products');
    const [category, setCategory] = useState<string | null>(null);
    const [editing, setEditing] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const [showTags, setShowTags] = useState(false);
    const [stats, setStats] = useState<ProductAnalytics | null>(null);
    const [statRange, setStatRange] = useState<ProductStatRange>(30);

    const tags = useMemo(() => ({
        amazonAssociateTag: user?.amazonAssociateTag,
        flipkartAffiliateId: user?.flipkartAffiliateId,
    }), [user?.amazonAssociateTag, user?.flipkartAffiliateId]);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [list, profile] = await Promise.all([
                supabaseAdapter.getProducts(user.id),
                supabaseAdapter.getBioProfile(user.id).catch(() => null),
            ]);
            setProducts(sortProducts(list.filter(p => p.type !== 'digital'))); // digital products aren't offered any more
            setBioProfile(profile);
        } catch (err) {
            console.error('Error loading products:', err);
            toast.error('Could not load your products');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    // Analytics load separately so the products show without waiting.
    useEffect(() => {
        if (!user?.id) return;
        let current = true;
        aggregatedAnalytics.getProductAnalytics(statRange).then(d => { if (current) setStats(d); });
        return () => { current = false; };
    }, [user?.id, statRange, products.length]);
    const clicksById = useMemo(() => new Map((stats?.products || []).map(p => [p.id, p.clicks])), [stats]);

    const categories = useMemo(() => productCategories(products), [products]);
    const shown = category ? products.filter(p => (p.category || '').trim().toLowerCase() === category.toLowerCase()) : products;
    const storeUrl = bioProfile ? `/@${bioProfile.handle}` : `/store/${user?.id}`;

    // ---- Adding --------------------------------------------------------
    const addUrls = async (urls: string[], onProgress: (done: number) => void) => {
        if (!user?.id) return;
        let added = 0, noDetails = 0, noLink = 0, failed = 0, limit = false;
        for (const [i, url] of urls.entries()) {
            try {
                const result = await addProductFromUrl(url, user.id, tags);
                added++;
                if (result.detailsMissing) noDetails++;
                if (result.linkProblem) { noLink++; if (result.linkProblem === 'limit') limit = true; }
                setProducts(prev => sortProducts([result.product, ...prev]));
            } catch (err) {
                console.error('Could not add product', url, err);
                failed++;
            }
            onProgress(i + 1);
        }
        if (added) toast.success(added === 1 ? 'Product added' : `${added} products added`);
        if (noDetails) toast(`${noDetails === 1 ? 'One product' : `${noDetails} products`} added without details. Click to fill in the price and image.`);
        if (noLink) toast(limit
            ? 'You have reached the free plan\'s link limit, so clicks on new products aren\'t counted.'
            : `${noLink === 1 ? 'One product has' : `${noLink} products have`} no short link, so clicks on it aren't counted.`);
        if (failed) toast.error(`${failed === 1 ? 'One link' : `${failed} links`} could not be added`);
    };

    // ---- Arranging -----------------------------------------------------
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const before = products;
        const from = products.findIndex(p => p.id === active.id);
        const to = products.findIndex(p => p.id === over.id);
        const moved = arrayMove(products, from, to).map((p, i) => ({ ...p, position: i }));
        setProducts(moved);
        try {
            // Only rows whose position changed.
            const changed = moved.filter(p => before.find(b => b.id === p.id)?.position !== p.position);
            await Promise.all(changed.map(p => supabaseAdapter.updateProduct(p.id, { position: p.position })));
        } catch (err) {
            console.error('Could not save the order', err);
            toast.error('Could not save the new order');
            setProducts(before);
        }
    };

    // ---- Editing -------------------------------------------------------
    const saveEdit = async (original: Product, draft: Product, destination: string) => {
        const updates: Partial<Product> = {
            name: draft.name.trim() || original.name,
            price: Number(draft.price) || 0,
            currency: draft.currency || 'INR',
            category: draft.category?.trim() || '',
            imageUrl: draft.imageUrl?.trim() || '',
            description: draft.description || '',
        };
        const raw = destination.trim();
        if (raw && raw !== (original.originalUrl || '')) {
            const web = safeWebUrl(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
            if (!web) { toast.error('The product link must be a web address'); return false; }
            const dest = await prepareDestination(web, tags);
            updates.originalUrl = dest;
            if (original.linkId) {
                await supabaseAdapter.updateLink(original.linkId, { originalUrl: dest });
            } else {
                const link = await createProductLink(dest, updates.name!);
                if (link.id) updates.linkId = link.id;
            }
        }
        const saved = await supabaseAdapter.updateProduct(original.id, updates);
        setProducts(prev => prev.map(p => (p.id === saved.id ? { ...p, ...saved } : p)));
        toast.success('Product saved');
        return true;
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        const target = deleting;
        setDeleting(null);
        try {
            await supabaseAdapter.deleteProduct(target.id);
            setProducts(prev => prev.filter(p => p.id !== target.id));
            toast.success('Product deleted');
        } catch (err) {
            console.error('Error deleting product:', err);
            toast.error('Could not delete the product');
        }
    };

    const setLook = async (look: 'light' | 'dark') => {
        if (!bioProfile) return;
        const previous = bioProfile;
        setBioProfile({ ...bioProfile, theme: look });
        try {
            await supabaseAdapter.updateBioProfile(bioProfile.id, { theme: look });
        } catch (err) {
            console.error('Could not change the look', err);
            toast.error('Could not change the look');
            setBioProfile(previous);
        }
    };

    const look = storeLook(bioProfile?.theme);

    return (
        <div className="min-h-screen bg-[#ECEBE7]">
            <div className="mx-auto max-w-7xl space-y-3.5 px-4 pb-16 sm:px-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 pb-2 pt-4 md:flex-row md:items-end">
                    <div>
                        <h1 className="text-[clamp(26px,3vw,34px)] font-semibold leading-tight tracking-[-0.02em] text-[#18181A]">Products</h1>
                        <p className="mt-1 text-sm text-[#8C8981]">
                            {products.length
                                ? `${products.length} on your store page`
                                : 'Paste a link to a product on any shop to add it to your store page.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {bioProfile && (
                            <div role="group" aria-label="Store page look" className="flex items-center gap-0.5 rounded-full bg-[#FBFAF8] p-1">
                                {(['light', 'dark'] as const).map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setLook(l)}
                                        aria-pressed={look === l}
                                        className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${look === l ? 'bg-[#18181A] text-[#F2F1EE]' : 'text-[#6E6B65] hover:text-[#18181A]'}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowTags(s => !s)} aria-expanded={showTags} className={`${softButton} bg-[#FBFAF8]`}>
                            Affiliate tags
                        </button>
                        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className={`${softButton} bg-[#FBFAF8]`}>
                            View store <ArrowUpRight className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {!bioProfile && !loading && (
                    <p className={`${tile} px-5 py-4 text-[13px] text-[#6E6B65]`}>
                        Your products show at <span className="font-mono text-[#18181A]">{window.location.host}{storeUrl}</span>.
                        {' '}Set up your <a href="/bio" className="font-medium text-[#18181A] underline underline-offset-2">bio page</a> to get a short address like <span className="font-mono">/@yourname</span> and a profile header.
                    </p>
                )}

                {showTags && (
                    <AffiliateTagsTile
                        initial={tags}
                        onSave={async values => {
                            await updateProfile(values);
                            toast.success('Affiliate tags saved. They are added to products you add from now on.');
                            setShowTags(false);
                        }}
                    />
                )}

                <QuickAdd onAdd={addUrls} />

                {stats && products.length > 0 && tab === 'products' && (
                    <ErrorBoundary>
                        <ProductStats data={stats} products={products} range={statRange} onRange={setStatRange} />
                    </ErrorBoundary>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
                        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-[#FBFAF8]" />)}
                    </div>
                ) : products.length === 0 ? null : (
                    <>
                        {categories.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filter by category">
                                {[null, ...categories].map(c => (
                                    <button key={c ?? 'all'} onClick={() => setCategory(c)} aria-pressed={category === c}
                                        className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${category === c ? 'bg-[#18181A] text-[#F2F1EE]' : 'bg-[#FBFAF8] text-[#6E6B65] hover:text-[#18181A]'}`}>
                                        {c ?? 'All'}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-[12px] text-[#8C8981]">
                            {category ? 'Show all products to rearrange them.' : 'Drag products to set their order on your store page.'}
                        </p>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={shown.map(p => p.id)} strategy={rectSortingStrategy}>
                                <ul className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
                                    {shown.map(p => (
                                        <ProductTile key={p.id} product={p} sortable={!category}
                                            clicks={stats ? clicksById.get(p.id) ?? (p.linkId ? 0 : undefined) : undefined} days={stats?.days}
                                            onEdit={() => setEditing(p)} onDelete={() => setDeleting(p)} />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </div>

            {editing && (
                <EditProduct
                    product={editing}
                    categories={categories}
                    userId={user?.id || ''}
                    onClose={() => setEditing(null)}
                    onSave={async (draft, destination) => {
                        try {
                            if (await saveEdit(editing, draft, destination)) setEditing(null);
                        } catch (err) {
                            console.error('Error saving product:', err);
                            toast.error('Could not save the product');
                        }
                    }}
                />
            )}

            {deleting && (
                <Dialog title="Delete product" onClose={() => setDeleting(null)}>
                    <p className="text-[14px] leading-relaxed text-[#6E6B65]">
                        “{deleting.name}” will be removed from your store page. Its short link keeps working.
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setDeleting(null)} className={softButton}>Cancel</button>
                        <button onClick={confirmDelete} className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-[13px] font-semibold text-white hover:bg-red-700">
                            <Trash2 className="h-4 w-4" /> Delete
                        </button>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

/** Paste one link, or switch to a box for many. */
const QuickAdd: React.FC<{ onAdd: (urls: string[], onProgress: (done: number) => void) => Promise<void> }> = ({ onAdd }) => {
    const [many, setMany] = useState(false);
    const [text, setText] = useState('');
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const urls = parseUrlList(text);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urls.length || progress) return;
        setProgress({ done: 0, total: urls.length });
        try {
            await onAdd(urls, done => setProgress({ done, total: urls.length }));
            setText('');
        } finally {
            setProgress(null);
        }
    };

    const busy = progress !== null;
    const submitLabel = busy
        ? (progress!.total > 1 ? `Adding ${Math.min(progress!.done + 1, progress!.total)} of ${progress!.total}` : 'Adding…')
        : urls.length > 1 ? `Add ${urls.length} products` : 'Add product';

    return (
        <form onSubmit={submit} className={`${tile} p-2`}>
            <div className={`flex flex-col gap-2 ${many ? '' : 'sm:flex-row sm:items-center'}`}>
                <label htmlFor="product-url" className="sr-only">{many ? 'Product links, one per line' : 'Product link'}</label>
                {many ? (
                    <textarea
                        id="product-url"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        disabled={busy}
                        rows={5}
                        placeholder={`Paste up to ${MAX_BULK_URLS} product links, one per line`}
                        className="min-h-[120px] w-full resize-y rounded-2xl border-none bg-transparent px-4 py-3 font-mono text-[13px] text-[#18181A] placeholder:font-sans placeholder:text-[#A19E97] focus:outline-none focus:ring-0"
                    />
                ) : (
                    <input
                        id="product-url"
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        disabled={busy}
                        placeholder="Paste a product link from Amazon, Flipkart or any shop"
                        className="min-w-0 flex-1 rounded-2xl border-none bg-transparent px-4 py-3 text-[15px] text-[#18181A] placeholder:text-[#A19E97] focus:outline-none focus:ring-0"
                    />
                )}
                <div className={`flex gap-2 ${many ? 'justify-end px-1 pb-1' : ''}`}>
                    <button type="button" onClick={() => setMany(m => !m)} disabled={busy} className={`${softButton} flex-1 sm:flex-none`}>
                        {many ? 'One link' : 'Add several'}
                    </button>
                    <button type="submit" disabled={busy || !urls.length} className={`${darkButton} flex-1 sm:flex-none`}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span>{submitLabel}</span>
                    </button>
                </div>
            </div>
            {busy && (
                <p className="px-4 pb-2 pt-1 text-[12px] text-[#8C8981]">Reading each page for the name, price and photo. This takes a few seconds per link.</p>
            )}
        </form>
    );
};

const ProductTile: React.FC<{ product: Product; sortable: boolean; clicks?: number; days?: number; onEdit: () => void; onDelete: () => void }> = ({ product, sortable, clicks, days, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id, disabled: !sortable });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined };
    const missing = !product.imageUrl || !(Number(product.price) > 0);
    return (
        <li ref={setNodeRef} style={style} className={`group relative flex flex-col rounded-3xl bg-white p-2 ${isDragging ? 'shadow-2xl' : ''}`}>
            <button onClick={onEdit} className="block text-left" aria-label={`Edit ${product.name}`}>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F7F6F3]">
                    {product.imageUrl
                        ? <img src={product.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain p-3" />
                        : <ImageIcon className="h-10 w-10 text-[#C9C6BF]" />}
                </div>
                <div className="px-1.5 pb-1 pt-3">
                    <h2 className="line-clamp-2 text-[14px] font-medium leading-snug text-[#18181A]">{product.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[14px] text-[#18181A]">
                            {Number(product.price) > 0 ? formatPrice(product.price, product.currency) : <span className="text-[#A19E97]">No price</span>}
                        </span>
                        {product.category && <span className="rounded-full bg-[#F0EEEA] px-2 py-0.5 text-[11px] text-[#6E6B65]">{product.category}</span>}
                        {!product.linkId && <span className="rounded-full bg-[#FFE9DE] px-2 py-0.5 text-[11px] text-[#C2410C]" title="Clicks on this product aren't counted">not tracked</span>}
                    </div>
                    {clicks !== undefined && <p className="mt-1.5 font-mono text-[11px] text-[#8C8981]">{clicks.toLocaleString('en-IN')} {clicks === 1 ? 'click' : 'clicks'} · {days}d</p>}
                    {missing && <p className="mt-1.5 text-[11px] text-[#C2410C]">Add {!product.imageUrl ? 'a photo' : ''}{!product.imageUrl && !(Number(product.price) > 0) ? ' and ' : ''}{!(Number(product.price) > 0) ? 'a price' : ''}</p>}
                </div>
            </button>
            <div className="absolute right-3 top-3 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {sortable && (
                    <button {...attributes} {...listeners} aria-label={`Move ${product.name}`} className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-white/90 text-[#6E6B65] shadow-sm active:cursor-grabbing">
                        <GripVertical className="h-4 w-4" />
                    </button>
                )}
                <button onClick={onEdit} aria-label={`Edit ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6E6B65] shadow-sm hover:text-[#18181A]">
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={onDelete} aria-label={`Delete ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6E6B65] shadow-sm hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </li>
    );
};

const Dialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}
                className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[#FBFAF8] p-6 sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-[18px] font-semibold text-[#18181A]">{title}</h2>
                    <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-[#8C8981] hover:bg-[#F0EEEA] hover:text-[#18181A]"><X className="h-5 w-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

const EditProduct: React.FC<{
    product: Product;
    categories: string[];
    userId: string;
    onClose: () => void;
    onSave: (draft: Product, destination: string) => Promise<void>;
}> = ({ product, categories, userId, onClose, onSave }) => {
    const [draft, setDraft] = useState<Product>(product);
    const [destination, setDestination] = useState(product.originalUrl || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const set = (patch: Partial<Product>) => setDraft(d => ({ ...d, ...patch }));

    const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;
        setUploading(true);
        try {
            set({ imageUrl: await supabaseAdapter.uploadProductImage(file, userId) });
        } catch (err) {
            console.error('Image upload failed:', err);
            toast.error('Could not upload the image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog title="Edit product" onClose={onClose} wide>
            <form
                onSubmit={async e => { e.preventDefault(); setSaving(true); try { await onSave(draft, destination); } finally { setSaving(false); } }}
                className="grid gap-4 sm:grid-cols-[180px_1fr]"
            >
                <div>
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white">
                        {draft.imageUrl
                            ? <img src={draft.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain p-2" />
                            : <ImageIcon className="h-10 w-10 text-[#C9C6BF]" />}
                    </div>
                    <label className={`${softButton} mt-2 w-full cursor-pointer`}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload photo
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={upload} className="sr-only" />
                    </label>
                </div>
                <div className="grid gap-3.5">
                    <div>
                        <label htmlFor="p-name" className={label}>Name</label>
                        <input id="p-name" required maxLength={200} value={draft.name} onChange={e => set({ name: e.target.value })} className={field} />
                    </div>
                    <div className="grid grid-cols-[1fr_96px] gap-2">
                        <div>
                            <label htmlFor="p-price" className={label}>Price</label>
                            <input id="p-price" type="number" min="0" step="any" inputMode="decimal" value={draft.price ?? ''} onChange={e => set({ price: e.target.value === '' ? 0 : Number(e.target.value) })} className={`${field} font-mono`} />
                        </div>
                        <div>
                            <label htmlFor="p-currency" className={label}>Currency</label>
                            <select id="p-currency" value={draft.currency || 'INR'} onChange={e => set({ currency: e.target.value })} className={field}>
                                {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="p-category" className={label}>Category</label>
                        <input id="p-category" list="p-categories" maxLength={40} value={draft.category || ''} onChange={e => set({ category: e.target.value })} placeholder="e.g. Phones" className={field} />
                        <datalist id="p-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                        <label htmlFor="p-url" className={label}>Product link</label>
                        <input id="p-url" inputMode="url" value={destination} onChange={e => setDestination(e.target.value)} className={`${field} font-mono text-[12px]`} />
                        <p className="mt-1 text-[11px] text-[#8C8981]">Your affiliate tag is added when you change this.</p>
                    </div>
                    <div>
                        <label htmlFor="p-image" className={label}>Photo address</label>
                        <input id="p-image" inputMode="url" value={draft.imageUrl || ''} onChange={e => set({ imageUrl: e.target.value })} placeholder="https://…" className={`${field} font-mono text-[12px]`} />
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={softButton}>Cancel</button>
                        <button type="submit" disabled={saving || uploading} className={darkButton}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                        </button>
                    </div>
                </div>
            </form>
        </Dialog>
    );
};

const AffiliateTagsTile: React.FC<{
    initial: { amazonAssociateTag?: string; flipkartAffiliateId?: string };
    onSave: (values: { amazonAssociateTag: string; flipkartAffiliateId: string }) => Promise<void>;
}> = ({ initial, onSave }) => {
    const [amazon, setAmazon] = useState(initial.amazonAssociateTag || '');
    const [flipkart, setFlipkart] = useState(initial.flipkartAffiliateId || '');
    const [saving, setSaving] = useState(false);
    return (
        <form
            className={`${tile} grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end`}
            onSubmit={async e => {
                e.preventDefault();
                setSaving(true);
                try { await onSave({ amazonAssociateTag: amazon.trim(), flipkartAffiliateId: flipkart.trim() }); }
                catch (err) { console.error(err); toast.error('Could not save the tags'); }
                finally { setSaving(false); }
            }}
        >
            <div>
                <label htmlFor="tag-amazon" className={label}>Amazon Associates tag</label>
                <input id="tag-amazon" value={amazon} onChange={e => setAmazon(e.target.value)} placeholder="yourtag-21" className={`${field} font-mono`} />
            </div>
            <div>
                <label htmlFor="tag-flipkart" className={label}>Flipkart affiliate ID</label>
                <input id="tag-flipkart" value={flipkart} onChange={e => setFlipkart(e.target.value)} placeholder="yourid" className={`${field} font-mono`} />
            </div>
            <button type="submit" disabled={saving} className={darkButton}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save tags</button>
        </form>
    );
};

export default ProductManager;
