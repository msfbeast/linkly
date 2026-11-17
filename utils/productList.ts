import { Product } from '../types';

/** Most URLs one "add several" paste may hold. */
export const MAX_BULK_URLS = 25;

/**
 * The web addresses in pasted text: one per line or separated by spaces or
 * commas, "https://" added where missing, duplicates and non-links dropped,
 * at most `max`.
 */
export function parseUrlList(text: string, max = MAX_BULK_URLS): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of text.split(/[\s,]+/)) {
        const token = raw.trim().replace(/^[<("']+|[>)"'.]+$/g, '');
        if (!token) continue;
        const candidate = /^https?:\/\//i.test(token) ? token : `https://${token}`;
        let url: URL;
        try { url = new URL(candidate); } catch { continue; }
        if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) continue;
        const key = url.toString();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(key);
        if (out.length >= max) break;
    }
    return out;
}

/**
 * Store order. Products the owner has never arranged (no position) come
 * first, newest first, so a new product shows at the top; then the arranged
 * ones in their saved order.
 */
export function sortProducts(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
        const pa = a.position ?? null;
        const pb = b.position ?? null;
        if (pa === null && pb === null) return b.createdAt - a.createdAt;
        if (pa === null) return -1;
        if (pb === null) return 1;
        return pa - pb || b.createdAt - a.createdAt;
    });
}
