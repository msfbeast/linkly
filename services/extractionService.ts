import { GoogleGenAI, Type } from "@google/genai";

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
 * Real Product Extraction Service
 * Hybrid Strategy:
 * 1. Jina AI Reader: Get clean Markdown content (bypasses many bot protections).
 * 2. Microlink: Get standard OpenGraph metadata as backup.
 * 3. Gemini Flash: Parse the chaos into structured product data.
 */
export async function extractProductMetadata(url: string): Promise<ExtractedMetadata | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY");
            // For development without key, you might want to throw or return null
            return null;
        }

        // Parallel Fetch: Jina (Content) + Microlink (Metadata)
        // We use 'allSettled' so if one fails, we can still try with the other
        const [jinaRes, microlinkRes] = await Promise.allSettled([
            fetch(`https://r.jina.ai/${url}`, {
                headers: { 'Assign-User-Agent': 'Mozilla/5.0' }
            }),
            fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
        ]);

        let markdown = "";
        let metadata: any = {};
        const possibleImages: string[] = [];

        // Process Jina Response
        if (jinaRes.status === 'fulfilled' && jinaRes.value.ok) {
            markdown = await jinaRes.value.text();
            const imgRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
            let match;
            while ((match = imgRegex.exec(markdown)) !== null) {
                possibleImages.push(match[1]);
            }
        }

        // Process Microlink Response
        if (microlinkRes.status === 'fulfilled' && microlinkRes.value.ok) {
            const data = await microlinkRes.value.json();
            if (data.status === 'success') {
                metadata = data.data;
                if (metadata.image?.url) possibleImages.unshift(metadata.image.url);
                if (metadata.logo?.url) possibleImages.push(metadata.logo.url);
            }
        }

        if (!markdown && metadata.description) {
            markdown = `Title: ${metadata.title}\nDescription: ${metadata.description}\nPublisher: ${metadata.publisher}`;
        }

        if (!markdown && Object.keys(metadata).length === 0) {
            return null;
        }

        // Gemini Extraction
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
      You are a Product Data Extractor.
      Url: ${url}
      Metadata: ${JSON.stringify(metadata)}
      Images Found: ${JSON.stringify(possibleImages.slice(0, 15))}
      Page Content: ${markdown.substring(0, 20000)}

      Task:
      1. Identify Product Title (clean).
      2. Find Price (number) and Currency.
      3. Select ONE best Image URL.
      4. Write short description.

      Return JSON:
      { "title": "...", "price": 0, "currency": "USD", "description": "...", "image": "..." }
    `;

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        description: { type: Type.STRING },
                        image: { type: Type.STRING }
                    }
                }
            }
        });

        // Use .text property as in geminiService.ts
        const text = result.text;
        if (!text) return null;

        let data: any = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            return null;
        }

        return {
            title: data.title || metadata.title || "New Product",
            price: data.price ? Number(data.price) : 0,
            currency: data.currency || "USD",
            description: data.description || metadata.description || "",
            images: data.image ? [data.image, ...possibleImages] : possibleImages,
            originalUrl: url,
            source: metadata.publisher || new URL(url).hostname
        };

    } catch (error) {
        console.error("Extraction Service Failed:", error);
        return null;
    }
}
