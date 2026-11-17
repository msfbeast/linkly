import { Product } from '../types';
import { supabaseAdapter } from './storage/supabaseAdapter';
import { extractProductMetadata } from './extractionService';
import { monetizeUrl, resolveShortUrl } from '../utils/affiliateUtils';
import { newShortCode } from '../utils/shortCode';
import { titleFromUrl } from '../utils/urlTitle';

export interface AffiliateTags {
    amazonAssociateTag?: string;
    flipkartAffiliateId?: string;
}

/** The seller URL with short Amazon links expanded and the owner's affiliate tag added. */
export async function prepareDestination(url: string, tags: AffiliateTags): Promise<string> {
    const expanded = await resolveShortUrl(url.trim());
    return monetizeUrl(expanded, tags);
}

/** A tracked short link for a product, or null with the reason it couldn't be made. */
export async function createProductLink(destination: string, title: string): Promise<{ id: string | null; problem?: string }> {
    try {
        const link = await supabaseAdapter.createLink({
            originalUrl: destination,
            shortCode: newShortCode(),
            title,
            clicks: 0,
            createdAt: Date.now(),
            tags: ['product'],
            clickHistory: [],
        });
        return { id: link.id };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { id: null, problem: /limit/i.test(message) ? 'limit' : message };
    }
}

export interface QuickAddResult {
    product: Product;
    /** Set when details couldn't be read from the page (name taken from the URL, no price or image). */
    detailsMissing: boolean;
    /** Set when no short link was made, so clicks on this product aren't counted. */
    linkProblem?: string;
}

/**
 * Make a product from a seller's page: read its name, price and image,
 * add the affiliate tag, make a short link so clicks are counted, and save.
 * Reading details or making the link can fail; the product is saved anyway.
 */
export async function addProductFromUrl(url: string, userId: string, tags: AffiliateTags): Promise<QuickAddResult> {
    const [destination, details] = await Promise.all([
        prepareDestination(url, tags),
        extractProductMetadata(url).catch(() => null),
    ]);
    const name = (details?.title && details.title !== 'New Product' ? details.title : titleFromUrl(url)).slice(0, 200);
    const link = await createProductLink(destination, name);
    const product = await supabaseAdapter.createProduct({
        userId,
        name,
        description: details?.description || '',
        price: Number.isFinite(details?.price) ? Number(details!.price) : 0,
        currency: details?.currency || 'INR',
        imageUrl: details?.images?.[0],
        linkId: link.id,
        originalUrl: destination,
        type: 'physical',
    } as Omit<Product, 'id' | 'createdAt'>);
    return { product, detailsMissing: !details, linkProblem: link.problem };
}
