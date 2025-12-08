export interface GeminiAnalysisResult {
  title: string;
  description: string;
  suggestedSlug: string;
  tags: string[];
  category: string;
  sentiment: string;
  predictedEngagement: 'High' | 'Medium' | 'Low';
}

// Client-side fallback for local development
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './storage/supabaseClient';
import { supabaseAdapter } from './storage/supabaseAdapter';

export const analyzeUrlWithGemini = async (url: string): Promise<GeminiAnalysisResult> => {
  try {
    // 0. Get Session Token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 1. Try Server-Side API (Preferred - avoids CORS and hides key)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      return await response.json();
    }

    console.warn('Backend API failed, falling back to client-side Gemini:', response.status);
    throw new Error('API_FAILED');

  } catch (error: any) {
    // 2. Client-Side Fallback (for local dev without Vercel CLI)
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (apiKey && (error.message === 'API_FAILED' || error.name === 'SyntaxError')) {
      try {
        console.log("Attempting Client-Side Analysis...");
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
             Analyze URL: "${url}"
             
             Return JSON with:
             1. title: Page title (max 50 chars).
             2. description: Summary (max 20 words).
             3. suggestedSlug: Short alphanumeric slug (max 10 chars).
             4. tags: Array of 3 short tags.
             
             Example:
             {"title": "Prod Name", "description": "Short summary.", "suggestedSlug": "prod-1", "tags": ["shop", "tech"]}
           `;

        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 1024,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedSlug: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        });

        if (result.text) {
          let cleanText = result.text.replace(/```json\n?|\n?```/g, '').trim();
          let parsed: GeminiAnalysisResult | null = null;

          try {
            parsed = JSON.parse(cleanText) as GeminiAnalysisResult;
          } catch (e) {
            console.warn("JSON Parse failed, using fallback.");
          }

          if (!parsed) parsed = {} as any;

          // Robust Fallbacks
          if (!parsed!.suggestedSlug) {
            parsed!.suggestedSlug = Math.random().toString(36).substring(2, 8);
          }
          if (!parsed!.tags || parsed!.tags.length === 0) {
            parsed!.tags = ['general'];
          }
          if (!parsed!.predictedEngagement) {
            parsed!.predictedEngagement = 'Medium';
          }
          if (!parsed!.category) parsed!.category = 'General';
          if (!parsed!.sentiment) parsed!.sentiment = 'Neutral';

          return parsed as GeminiAnalysisResult;
        }
      } catch (clientError) {
        console.error("Client-side Gemini failed:", clientError);
      }
    }

    console.error("Gemini analysis totally failed:", error);
    return {
      title: "New Link",
      description: "Analysis failed, please enter manually.",
      suggestedSlug: Math.random().toString(36).substring(2, 8),
      tags: ["general"],
      category: "Uncategorized",
      sentiment: "Neutral",
      predictedEngagement: "Low" as const
    };
  }
};

// Social Post Generation (Placeholder - should move to API)
export const generateSocialPost = async (linkData: any): Promise<string> => {
  // Return mock for now or implement API call
  return `Check out this link: ${linkData.title} #linkly`;
}

export interface ProductDetails {
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export const generateLinkMetadata = async (url: string, currentTitle?: string): Promise<{ title: string, description: string }> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return { title: currentTitle || "New Link", description: "" };

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert copywriter. 
      Analyze this URL: "${url}"
      ${currentTitle ? `Current title context: "${currentTitle}"` : ''}
      
      Tasks:
      1. Generate a catchy, high-CTR title (max 50 chars). No clickbait.
      2. Generate a concise, engaging description (max 100 chars).
      
      Return JSON:
      {
        "title": "...",
        "description": "..."
      }
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
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = result.text || "";
    if (text) {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || currentTitle || "New Link",
        description: parsed.description || ""
      };
    }
    return { title: currentTitle || "New Link", description: "" };

  } catch (error) {
    console.error("Smart Link Metadata generation failed:", error);
    return { title: currentTitle || "New Link", description: "" };
  }
};

export const generateBio = async (keywords: string, currentBio?: string): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return currentBio || "";

    const ai = new GoogleGenAI({ apiKey });
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
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return result.text ? result.text.trim() : (currentBio || "");
  } catch (error) {
    console.error("Bio generation failed:", error);
    return currentBio || "";
  }
};

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  // Placeholder or move to API
  return null;
};


export const generateBackgroundImage = async (prompt: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // 1. Generate Image with Imagen 3
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 }
    })
  });

  if (!response.ok) {
    throw new Error(`Imagen API failed: ${response.statusText}`);
  }

  const data = await response.json();
  const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

  if (!base64Image) {
    throw new Error("No image generated");
  }

  // 2. Convert to File
  const byteString = atob(base64Image);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([int8Array], { type: 'image/jpeg' });
  const file = new File([blob], "ai-background.jpg", { type: 'image/jpeg' });

  // 3. Upload to Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("User not authenticated");

  return await supabaseAdapter.uploadGalleryImage(file, session.user.id);
};
