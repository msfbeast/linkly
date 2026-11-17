import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowUpRight, Search, ShoppingBag } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { BioProfile, LinkData, Product } from '../types';
import { BioWidget } from '../components/BioWidget';
import { AppStackBlock } from '../components/blocks/AppStackBlock';
import { BioError } from '../components/BioError';
import { FEATURES } from '../utils/featureFlags';
import { formatPrice } from '../utils/formatPrice';
import { filterProducts, productCategories, productHref, storeLook, StoreLook } from '../utils/storePage';
import { sortProducts } from '../utils/productList';

/**
 * The public store page: a profile header, a searchable grid of product
 * links to other sites, and the owner's plain links. One page for what used
 * to be the bio page (/p/handle, /@handle) and the storefront
 * (/store/userId).
 */

interface StorePageProps {
    /** Set when a custom domain maps to a profile. */
    handle?: string;
}

/** Colours for the two looks. */
const LOOKS: Record<StoreLook, Record<string, string>> = {
    light: {
        page: 'bg-[#ECEBE7] text-[#18181A]',
        tile: 'bg-[#FBFAF8]',
        card: 'bg-white',
        image: 'bg-[#F7F6F3]',
        muted: 'text-[#8C8981]',
        soft: 'bg-[#F0EEEA] text-[#4A4843]',
        softHover: 'hover:bg-[#E6E3DD]',
        active: 'bg-[#18181A] text-[#F2F1EE]',
        input: 'text-[#18181A] placeholder:text-[#A19E97]',
        bar: 'bg-[#ECEBE7]/90',
    },
    dark: {
        page: 'bg-[#111113] text-[#F2F1EE]',
        tile: 'bg-[#18181A]',
        card: 'bg-[#1E1E21]',
        image: 'bg-[#26262A]',
        muted: 'text-[#8E8B84]',
        soft: 'bg-[#232326] text-[#C9C6BF]',
        softHover: 'hover:bg-[#2B2B2E]',
        active: 'bg-[#F2F1EE] text-[#18181A]',
        input: 'text-[#F2F1EE] placeholder:text-[#77746D]',
        bar: 'bg-[#111113]/90',
    },
};

type Loaded =
    | { state: 'loading' }
    | { state: 'missing' }
    | { state: 'error' }
    | { state: 'redirect'; to: string }
    | { state: 'ready'; profile: BioProfile | null; products: Product[]; links: LinkData[]; codes: Map<string, string> };

const StorePage: React.FC<StorePageProps> = ({ handle: propHandle }) => {
    const params = useParams<{ handle?: string; userId?: string }>();
    const handle = propHandle || params.handle || '';
    const userId = handle ? '' : params.userId || '';

    const [data, setData] = useState<Loaded>({ state: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const [tab, setTab] = useState<'products' | 'links'>('products');
    const [category, setCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let current = true;
        setData({ state: 'loading' });
        (async () => {
            let profile: BioProfile | null = null;
            if (handle) {
                profile = await supabaseAdapter.getBioProfileByHandle(handle);
                if (!profile) return { state: 'missing' } as Loaded;
            } else if (userId) {
                // Old storefront address: send it to the owner's page when they have one.
                profile = await supabaseAdapter.getBioProfile(userId);
                if (profile) return { state: 'redirect', to: `/@${profile.handle}` } as Loaded;
            } else {
                return { state: 'missing' } as Loaded;
            }

            const ownerId = profile?.userId || userId;
            const all = await supabaseAdapter.getProducts(ownerId);
            // Digital products (sold here with checkout) are parked.
            const products = sortProducts(FEATURES.DIGITAL_PRODUCTS ? all : all.filter(p => p.type !== 'digital'));
            if (!profile && products.length === 0) return { state: 'missing' } as Loaded;

            // One lookup for the owner's links and the products' short links.
            const linkIds = profile?.links || [];
            const productLinkIds = products.map(p => p.linkId).filter((id): id is string => !!id);
            const publicLinks = await supabaseAdapter.getPublicLinks([...new Set([...linkIds, ...productLinkIds])])
                .catch(() => [] as LinkData[]);
            const byId = new Map(publicLinks.map(l => [l.id, l]));
            const links = linkIds.map(id => byId.get(id)).filter((l): l is LinkData => !!l);
            const codes = new Map(publicLinks.filter(l => l.shortCode).map(l => [l.id, l.shortCode]));
            return { state: 'ready', profile, products, links, codes } as Loaded;
        })()
            .then(result => { if (current) setData(result); })
            .catch(err => {
                console.error('Error loading store page:', err);
                if (current) setData({ state: 'error' });
            });
        return () => { current = false; };
    }, [handle, userId, attempt]);

    const products = data.state === 'ready' ? data.products : [];
    const categories = useMemo(() => productCategories(products), [products]);
    const shown = useMemo(() => filterProducts(products, category, search), [products, category, search]);

    if (data.state === 'redirect') return <Navigate to={data.to} replace />;
    if (data.state === 'error') return <BioError message="Couldn't load this page. Please check your connection." onRetry={() => setAttempt(n => n + 1)} />;
    if (data.state === 'missing') return <BioError message={handle ? `@${handle} not found` : 'Store not found'} />;

    const look = LOOKS[storeLook(data.state === 'ready' ? data.profile?.theme : undefined)];

    if (data.state === 'loading') {
        return (
            <div className="min-h-screen bg-[#ECEBE7] px-4 py-8" aria-busy="true" aria-label="Loading">
                <div className="mx-auto max-w-5xl animate-pulse space-y-3.5">
                    <div className="h-40 rounded-3xl bg-[#FBFAF8]" />
                    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-3xl bg-[#FBFAF8]" />)}
                    </div>
                </div>
            </div>
        );
    }

    const { profile, links, codes } = data;
    const hasProducts = products.length > 0;
    const hasLinks = links.length > 0;
    const activeTab = hasProducts && (tab === 'products' || !hasLinks) ? 'products' : 'links';
    const name = profile?.displayName || (profile ? `@${profile.handle}` : 'Store');
    const pill = (active: boolean) =>
        `whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${active ? look.active : `${look.soft} ${look.softHover}`}`;

    return (
        <div className={`min-h-screen ${look.page}`}>
            <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
                {/* Who this is */}
                <header className={`flex flex-col items-center gap-4 rounded-3xl p-6 text-center sm:flex-row sm:gap-6 sm:p-8 sm:text-left ${look.tile}`}>
                    <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl font-semibold sm:h-24 sm:w-24 ${look.soft}`}>
                        {profile?.avatarUrl
                            ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                            : <span aria-hidden>{name.replace(/^@/, '').charAt(0).toUpperCase() || <ShoppingBag className="h-8 w-8" />}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-[clamp(24px,4vw,34px)] font-semibold leading-tight tracking-[-0.02em]">{name}</h1>
                        {profile && profile.displayName && <p className={`mt-1 font-mono text-[13px] ${look.muted}`}>@{profile.handle}</p>}
                        {profile?.bio && <p className={`mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed ${look.muted}`}>{profile.bio}</p>}
                    </div>
                    {hasProducts && (
                        <div className="shrink-0 sm:text-right">
                            <div className="font-mono text-[32px] font-medium leading-none tracking-[-0.03em]">{products.length}</div>
                            <div className={`mt-1 text-[12px] ${look.muted}`}>{products.length === 1 ? 'product' : 'products'}</div>
                        </div>
                    )}
                </header>

                {/* Tabs, search, categories */}
                {(hasProducts || hasLinks) && (
                    <div className={`sticky top-0 z-10 -mx-4 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 ${look.bar}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            {hasProducts && hasLinks && (
                                <div role="tablist" aria-label="Sections" className="flex gap-1.5">
                                    <button role="tab" aria-selected={activeTab === 'products'} onClick={() => setTab('products')} className={pill(activeTab === 'products')}>Products</button>
                                    <button role="tab" aria-selected={activeTab === 'links'} onClick={() => setTab('links')} className={pill(activeTab === 'links')}>Links</button>
                                </div>
                            )}
                            {activeTab === 'products' && products.length > 6 && (
                                <div className={`relative flex-1 rounded-full ${look.tile}`}>
                                    <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${look.muted}`} />
                                    <label htmlFor="store-search" className="sr-only">Search products</label>
                                    <input
                                        id="store-search"
                                        type="search"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search products"
                                        className={`w-full rounded-full border-none bg-transparent py-2.5 pl-11 pr-4 text-[14px] focus:outline-none focus:ring-0 ${look.input}`}
                                    />
                                </div>
                            )}
                        </div>
                        {activeTab === 'products' && categories.length > 1 && (
                            <div className="mt-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Categories">
                                <button onClick={() => setCategory(null)} aria-pressed={category === null} className={pill(category === null)}>All</button>
                                {categories.map(c => (
                                    <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={pill(category === c)}>{c}</button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Products */}
                {activeTab === 'products' && hasProducts && (
                    shown.length === 0 ? (
                        <p className={`rounded-3xl py-14 text-center text-sm ${look.tile} ${look.muted}`}>No products match your search.</p>
                    ) : (
                        <ul className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4">
                            {shown.map(product => {
                                const href = productHref(product, codes);
                                const body = (
                                    <>
                                        <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-2xl ${look.image}`}>
                                            {product.imageUrl
                                                ? <img src={product.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]" />
                                                : <ShoppingBag className={`h-10 w-10 ${look.muted}`} />}
                                        </div>
                                        <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
                                            <h2 className="line-clamp-2 text-[14px] font-medium leading-snug">{product.name}</h2>
                                            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                                                {Number(product.price) > 0
                                                    ? <span className="font-mono text-[15px] font-medium tracking-[-0.02em]">{formatPrice(product.price, product.currency)}</span>
                                                    : <span />}
                                                {href && (
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF5A14] text-white transition-transform group-hover:scale-110">
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                                const cls = `group flex h-full flex-col rounded-3xl p-2 ${look.card}`;
                                return (
                                    <li key={product.id}>
                                        {href
                                            ? <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={cls}>{body}</a>
                                            : <div className={cls}>{body}</div>}
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}

                {/* Links */}
                {activeTab === 'links' && (
                    <div className="mx-auto grid max-w-2xl gap-2.5">
                        {links.map(link => link.type && link.type !== 'link' ? (
                            <div key={link.id} className="overflow-hidden rounded-3xl">
                                <BioWidget link={link} profile={profile!} />
                            </div>
                        ) : (
                            <a
                                key={link.id}
                                href={`/r/${encodeURIComponent(link.shortCode)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group flex items-center justify-between gap-3 rounded-3xl px-5 py-4 text-[15px] font-medium ${look.card}`}
                            >
                                <span className="min-w-0 truncate">{link.title}</span>
                                <ArrowUpRight className={`h-4 w-4 shrink-0 transition-colors group-hover:text-[#FF5A14] ${look.muted}`} />
                            </a>
                        ))}
                        {profile && profile.blockVisibility?.appStack !== false && <AppStackBlock userId={profile.userId} />}
                    </div>
                )}

                {!hasProducts && !hasLinks && (
                    <p className={`mt-3.5 rounded-3xl py-14 text-center text-sm ${look.tile} ${look.muted}`}>Nothing here yet. Check back soon.</p>
                )}

                <footer className={`mt-12 text-center text-[12px] ${look.muted}`}>
                    <a href="/" className="hover:underline">Made with Gather</a>
                </footer>
            </div>
        </div>
    );
};

export default StorePage;
