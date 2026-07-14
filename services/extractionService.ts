import { supabase } from './storage/supabaseClient';

interface ExtractedMetadata {
    title: string;
    price: number;
    currency: string;
    description: string;
    images: string[];
    originalUrl: string;
    source: string;
}

/**
 * Product Extraction Service
 * Delegates to the authenticated server endpoint /api/ai/extract_product
 * (Jina + Microlink + Gemini run server-side; no API keys in the browser).
 */
export async function extractProductMetadata(url: string): Promise<ExtractedMetadata | null> {
    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/ai/extract_product', {
            method: 'POST',
            headers,
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            console.warn('Product extraction API failed:', response.status);
            return null;
        }

        const data = await response.json();

        return {
            title: data.name || "New Product",
            price: data.price ? Number(data.price) : 0,
            currency: data.currency || "USD",
            description: data.description || "",
            images: data.imageUrl ? [data.imageUrl] : [],
            originalUrl: url,
            source: new URL(url).hostname
        };
    } catch (error) {
        console.error("Extraction Service Failed:", error);
        return null;
    }
}
