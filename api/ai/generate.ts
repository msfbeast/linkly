import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";
import { requireAiUser, validUrl, boundedText } from '../_lib/aiGuard';

// Initialize Gemini on the server side (key never reaches the client)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

/**
 * Consolidated AI generation endpoint.
 * Replaces the old client-side Gemini fallbacks so GEMINI_API_KEY
 * is never bundled into the browser build.
 *
 * POST body: { action: 'link_metadata' | 'bio' | 'profile_chat' | 'background_image', ...params }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Signed-in users only, rate limited per user (api/_lib/aiGuard.ts).
    if (!(await requireAiUser(req, res))) return;

    try {
        const { action } = req.body || {};

        switch (action) {
            case 'link_metadata': {
                const url = validUrl(req.body.url);
                const currentTitle = boundedText(req.body.currentTitle);
                if (!url) return res.status(400).json({ error: 'A valid url is required' });

                const prompt = `
                  You are an expert copywriter.
                  Analyze this URL: "${url}"
                  ${currentTitle ? `Current title context: "${currentTitle}"` : ''}

                  Tasks:
                  1. Generate a catchy, high-CTR title (max 50 chars). No clickbait.
                  2. Generate a concise, engaging description (max 100 chars).

                  Return JSON: { "title": "...", "description": "..." }
                `;

                const result = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    }
                });

                const text = result.text || "";
                let parsed: any = {};
                try { parsed = JSON.parse(text); } catch { /* fall through to defaults */ }
                return res.status(200).json({
                    title: parsed.title || currentTitle || "New Link",
                    description: parsed.description || ""
                });
            }

            case 'bio': {
                const keywords = boundedText(req.body.keywords);
                const currentBio = boundedText(req.body.currentBio);
                if (!keywords) return res.status(400).json({ error: 'keywords is required' });

                const prompt = `
                  You are a personal branding expert.
                  Write a professional, engaging Instagram-style bio based on these keywords/context: "${keywords}".

                  Rules:
                  - Max 150 characters.
                  - Use relevant emojis.
                  - Make it sound human and authentic.
                  - Return ONLY the bio text.
                `;

                const result = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                });

                return res.status(200).json({ bio: result.text ? result.text.trim() : (currentBio || "") });
            }

            // NOTE: 'profile_chat' and 'background_image' actions were retired
            // in the 2026-07 feature cut. Recover from git history if needed.

            default:
                return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (error: any) {
        console.error('[AI] Generation failed:', error);
        return res.status(500).json({ error: 'Generation failed' });
    }
}
