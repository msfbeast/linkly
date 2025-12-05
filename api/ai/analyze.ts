import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini on the server side
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// Define the interface for the response
interface GeminiAnalysisResult {
    title: string;
    description: string;
    suggestedSlug: string;
    tags: string[];
    category: string;
    sentiment: string;
    predictedEngagement: 'High' | 'Medium' | 'Low';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log('[AI] Analyzing URL:', url);

        // 1. Fetch content (Server-side fetch avoids CORS issues usually)
        let pageContent = "";
        const isAmazon = url.includes('amazon.') || url.includes('amzn.');
        let amazonAsin = '';

        if (isAmazon) {
            const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/i);
            if (asinMatch) amazonAsin = asinMatch[1] || asinMatch[2];
        }

        // Try Jina Reader
        try {
            const jinaUrl = `https://r.jina.ai/${url}`;
            const response = await fetch(jinaUrl, { signal: AbortSignal.timeout(8000) });
            if (response.ok) {
                const text = await response.text();
                pageContent = text.substring(0, 10000);
            }
        } catch (e) {
            console.error('[AI] Jina fetch failed:', e);
        }

        // Try Microlink fallback
        if (!pageContent || pageContent.length < 500) {
            try {
                const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
                const response = await fetch(microlinkUrl, { signal: AbortSignal.timeout(5000) });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.data) {
                        pageContent = `
              Title: ${data.data.title || ''}
              Description: ${data.data.description || ''}
              Publisher: ${data.data.publisher || ''}
              Author: ${data.data.author || ''}
            `;
                    }
                }
            } catch (e) {
                console.error('[AI] Microlink fetch failed:', e);
            }
        }

        const prompt = `
      Analyze the following URL and its content:
      URL: "${url}"
      ${amazonAsin ? `Amazon ASIN: ${amazonAsin}` : ''}
      
      Page Content:
      ${pageContent}
      
      ${isAmazon ? `IMPORTANT: Extract the ACTUAL product name, not "Amazon.in".` : ''}
      
      Task:
      1. Extract the REAL page/product title.
      2. Generate a helpful description (under 160 chars).
      3. Create a short, unique 'slug' (max 8 chars, alphanumeric, related to content).
      4. Generate 3 relevant tags.
      5. Determine the category.
      6. Analyze sentiment.
      7. Predict engagement level.
      
      Return JSON matching the schema.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp", // Use lighter/faster model if available, or fallback to standard
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        suggestedSlug: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        category: { type: Type.STRING },
                        sentiment: { type: Type.STRING },
                        predictedEngagement: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                    },
                    required: ['title', 'description', 'suggestedSlug', 'tags', 'category', 'sentiment', 'predictedEngagement']
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");

        const result = JSON.parse(text) as GeminiAnalysisResult;
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[AI] Analysis failed:', error);
        return res.status(500).json({
            error: error.message || 'Analysis failed',
            fallback: {
                title: "New Link",
                description: "Analysis failed, please enter manually.",
                suggestedSlug: Math.random().toString(36).substring(2, 8),
                tags: ["general"],
                category: "Uncategorized",
                sentiment: "Neutral",
                predictedEngagement: "Low"
            }
        });
    }
}
