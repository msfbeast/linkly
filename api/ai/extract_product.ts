import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

interface ProductDetails {
    name: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth Check
    if (supabase) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        console.log('[AI] Extracting product from:', url);

        let pageContent = "";
        let possibleImages: string[] = [];

        // 1. Fetch content via Jina (Markdown)
        // High Priority: Extract images from content
        try {
            const jinaUrl = `https://r.jina.ai/${url}`;
            const response = await fetch(jinaUrl, { signal: AbortSignal.timeout(8000) });
            if (response.ok) {
                const text = await response.text();
                pageContent = text.substring(0, 20000);

                const markdownImageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
                let match;
                while ((match = markdownImageRegex.exec(text)) !== null) {
                    if (!possibleImages.includes(match[1])) {
                        possibleImages.push(match[1]);
                    }
                }
            }
        } catch (e) {
            console.error('[AI] Jina fetch failed:', e);
        }

        // 2. Fallback/Supplement with Microlink
        try {
            const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
            const response = await fetch(microlinkUrl, { signal: AbortSignal.timeout(6000) });
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.data) {
                    // Lower Priority: Metadata images (append to end)
                    if (data.data.image?.url) possibleImages.push(data.data.image.url);
                    if (data.data.logo?.url) possibleImages.push(data.data.logo.url);

                    if (!pageContent) {
                        pageContent = `
                          Title: ${data.data.title || ''}
                          Description: ${data.data.description || ''}
                          Publisher: ${data.data.publisher || ''}
                        `;
                    }
                }
            }
        } catch (e) {
            console.error('[AI] Microlink fetch failed:', e);
        }

        // 3. Filter Bad Images
        const badKeywords = [
            'logo', 'icon', 'favicon', 'branding', 'placeholder', 'site-image',
            'nav', 'header', 'social', 'amazon_logo', 'flipkart_logo',
            'visa', 'mastercard', 'amex', 'paypal', 'payment', 'bank', 'wallet', 'upi'
        ];
        possibleImages = possibleImages.filter(img =>
            !badKeywords.some(keyword => img.toLowerCase().includes(keyword))
        );

        const prompt = `
      Analyze this product URL and content.
      URL: "${url}"
      
      Page Content (Markdown):
      ${pageContent}
      
      Potential Image URLs found (Ordered by visual relevance):
      ${possibleImages.slice(0, 15).join('\n')}
      
      Task:
      1. Extract the PRECISE Product Name (clean up amazon junk like "Amazon.in: ...").
      2. Find the PRICE (numeric). If multiple, pick the main offer price.
      3. Identify CURRENCY (ISO Code).
      4. Select the BEST high-quality PRODUCT IMAGE URL. 
         - **CRITICAL**: Do NOT select a company logo, payment icon, or banner.
         - Select a photo that looks like the ACTUAL PRODUCT.
         - Use the 'Potential Image URLs' list.
         - MUST be a valid absolute URL.
      5. Write short description (under 200 chars).
      
      Return JSON only.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        imageUrl: { type: Type.STRING }
                    },
                    required: ['name', 'price']
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");
        const result = JSON.parse(text) as ProductDetails;

        // 4. Robust Fallbacks (Sync with Client-Side Logic)

        // STRICT Currency Overrides
        if (url.includes("amazon.in") || url.includes("flipkart.com") || url.includes("myntra.com")) {
            result.currency = "INR";
        }

        // Image Fallback
        const isBadImage = (img: string) => !img || badKeywords.some(k => img.toLowerCase().includes(k));
        if (isBadImage(result.imageUrl)) {
            // Find first valid image in our filtered list
            const fallback = possibleImages.find(img => !isBadImage(img));
            if (fallback) {
                result.imageUrl = fallback;
                console.log('[AI] Using fallback image:', fallback);
            }
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[AI] Product extraction failed:', error);
        return res.status(500).json({ error: 'Extraction failed' });
    }
}
