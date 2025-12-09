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
// Client-side fallback for local development
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './storage/supabaseClient';
import { supabaseAdapter } from './storage/supabaseAdapter';

export interface ProfileContext {
  displayName: string;
  bio: string;
  links: { title: string; url: string; active: boolean }[];
}

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
    if (text && text.trim()) {
      try {
        const parsed = JSON.parse(text);
        return {
          title: parsed.title || currentTitle || "New Link",
          description: parsed.description || ""
        };
      } catch (parseError) {
        console.warn("Smart Link Metadata JSON parse failed, using fallback");
        return { title: currentTitle || "New Link", description: "" };
      }
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

export const chatWithProfile = async (context: ProfileContext, query: string, history: string[] = []): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return "AI Chat is currently unavailable.";

    const ai = new GoogleGenAI({ apiKey });

    // Construct context string
    const linksContext = context.links
      .filter(l => l.active)
      .map(l => `- ${l.title} (${l.url})`)
      .join('\n');

    const systemPrompt = `
      You are an AI assistant representing ${context.displayName}.
      
      Bio: "${context.bio}"
      
      Links/Content available:
      ${linksContext}
      
      Your Goal: Answer the visitor's question based ONLY on the info above.
      - Be friendly and helpful.
      - If the answer is in a link, direct them to that specific link.
      - If you don't know, say "I don't see that info on their profile."
      - Keep answers short (under 50 words unless asked for more).
      - Do not make up facts.
    `;

    // Fallback to flash if exp not available or for speed. Using 2.0-flash-exp as per prev setup.

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] }, // System instruction disguised as first user msg for simple API
        ...history.map(msg => ({ role: 'user', parts: [{ text: msg }] })), // Simplified history for now
        { role: 'user', parts: [{ text: query }] }
      ],
    });

    return result.text ? result.text.trim() : "I'm not sure how to answer that.";
  } catch (error) {
    console.error("Chat generation failed:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  try {
    // 0. Get Session Token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 1. Try Server-Side API (Preferred - can fetch page content)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/ai/extract_product', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        return await response.json();
      }
      console.warn('Product API failed, falling back to client-side:', response.status);
    } catch (apiError) {
      console.warn('Product API error:', apiError);
    }

    // 2. Client-Side Fallback (Jina AI Scrape + Gemini)
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return null;

    let pageContext = "";
    let possibleImages: string[] = [];

    // Parallel fetch for speed
    await Promise.allSettled([
      // 1. Jina AI (Content) - High Priority for Product Images
      (async () => {
        try {
          const jinaResponse = await fetch(`https://r.jina.ai/${url}`, { headers: { 'x-respond-with': 'markdown' } });
          if (jinaResponse.ok) {
            const text = await jinaResponse.text();
            pageContext = text.substring(0, 20000); // 20k chars

            // Extract valid image URLs from markdown immediately
            const markdownImageRegex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
            let match;
            while ((match = markdownImageRegex.exec(text)) !== null) {
              // Unshift to put content images FIRST (higher priority than metadata)
              if (!possibleImages.includes(match[1])) {
                possibleImages.unshift(match[1]);
              }
            }
          }
        } catch (e) { console.warn("Jina fetch failed", e); }
      })(),
      // 2. Microlink (Metadata) - Fallback
      (async () => {
        try {
          const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
          const response = await fetch(microlinkUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.data) {
              // Push metadata images to the END (lower priority)
              if (data.data.image?.url) possibleImages.push(data.data.image.url);

              // Append metadata to context
              pageContext += `\n\nMicrolink Metadata:\nTitle: ${data.data.title}\nDescription: ${data.data.description}\nPublisher: ${data.data.publisher}\n`;
            }
          }
        } catch (e) { console.warn("Microlink fetch failed", e); }
      })()
    ]);

    // Filter out obvious logos/icons/brand placeholders
    const badKeywords = [
      'logo', 'icon', 'favicon', 'branding', 'placeholder', 'site-image',
      'nav', 'header', 'social', 'amazon_logo', 'flipkart_logo',
      'visa', 'mastercard', 'amex', 'paypal', 'payment', 'bank', 'wallet', 'upi'
    ];
    possibleImages = possibleImages.filter(img =>
      !badKeywords.some(keyword => img.toLowerCase().includes(keyword))
    );

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an e-commerce expert.
      Analyze this product from the URL, scraped markdown content, and metadata.
      
      URL: "${url}"
      
      Potential Images Found (Ordered by visual relevance):
      ${possibleImages.slice(0, 15).join('\n')}
      
      Content (Markdown):
      ${pageContext}
      
      Task:
      1. Extract the PRECISE Product Name. Clean up titles (remove "Amazon.in:", "Buy...", etc).
      2. Find the PRICE (numeric). 
         - If multiple, pick the main offer price.
         - Round to 2 decimal places.
      3. Identify CURRENCY (ISO Code).
      4. Select the BEST PRODUCT IMAGE URL.
         - **CRITICAL**: Do NOT select a company logo (like "Flipkart" text, "Amazon" smile).
         - Select a photo that looks like the ACTUAL PRODUCT.
         - Use the 'Potential Images Found' list.
         - MUST be a valid absolute URL.
      5. Write a short description (max 200 chars).
      
      Return JSON only:
      {
        "name": "...",
        "description": "...",
        "price": 0.00,
        "currency": "USD",
        "imageUrl": "..."
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
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            imageUrl: { type: Type.STRING }
          }
        }
      }
    });

    const text = result.text || "";
    if (text) {
      const parsed = JSON.parse(text);

      // Robust Image Fallback: If AI fails or returns a filtered image, try the next best
      let finalImageUrl = parsed.imageUrl;
      const isBadImage = (img: string) => !img || badKeywords.some(k => img.toLowerCase().includes(k));

      if (isBadImage(finalImageUrl)) {
        // Find first valid image in our filtered list
        const fallback = possibleImages.find(img => !isBadImage(img));
        if (fallback) {
          finalImageUrl = fallback;
          console.log("AI returned bad image, using fallback:", fallback);
        }
      }

      // STRICT Currency Overrides
      let finalCurrency = parsed.currency || "USD";
      if (url.includes("amazon.in") || url.includes("flipkart.com") || url.includes("myntra.com")) {
        finalCurrency = "INR";
      }

      return {
        name: parsed.name || "New Product",
        description: parsed.description || "",
        price: parsed.price ? Number(parsed.price.toFixed(2)) : 0,
        currency: finalCurrency,
        imageUrl: finalImageUrl || ""
      };
    }
    return null;

  } catch (error) {
    console.error("Product extraction failed:", error);
    return null;
  }
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
