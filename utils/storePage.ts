import { Product } from '../types';
import { safeWebUrl } from './safeUrl';

/** The store page has two looks. */
export type StoreLook = 'light' | 'dark';

/** Older bio themes that were dark; every other legacy theme maps to light. */
const LEGACY_DARK_THEMES = new Set(['dark', 'cyberpunk', 'midnight', 'terminal', 'gamer', 'industrial', 'aura', 'pixel', 'luxury']);

/** The look for a stored theme value: 'light' / 'dark', or a legacy theme name. */
export function storeLook(theme: string | null | undefined): StoreLook {
    return theme && LEGACY_DARK_THEMES.has(theme) ? 'dark' : 'light';
}

/** Distinct product categories in first-seen order, blanks dropped. */
export function productCategories(products: Product[]): string[] {
    const seen = new Map<string, string>();
    for (const p of products) {
        const name = (p.category || '').trim();
        if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
    }
    return [...seen.values()];
}

/** Products matching a category (null = all) and a search over name, description and category. */
export function filterProducts(products: Product[], category: string | null, search: string): Product[] {
    const q = search.trim().toLowerCase();
    const cat = category?.trim().toLowerCase() || null;
    return products.filter(p => {
        if (cat && (p.category || '').trim().toLowerCase() !== cat) return false;
        if (!q) return true;
        return [p.name, p.description, p.category].some(v => (v || '').toLowerCase().includes(q));
    });
}

/**
 * Where a product card goes. Through its short link when it has one, so the
 * click is counted; otherwise straight to the seller's page. Null when the
 * product has no usable destination.
 */
export function productHref(product: Product, shortCodeByLinkId: Map<string, string>): string | null {
    const code = product.shortCode || (product.linkId ? shortCodeByLinkId.get(product.linkId) : undefined);
    if (code) return `/r/${encodeURIComponent(code)}`;
    return safeWebUrl(product.originalUrl);
}
