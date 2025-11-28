import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeminiAnalysisResult {
  title: string;
  description: string;
  suggestedSlug: string;
  tags: string[];
  category: string;
  sentiment: string;
  predictedEngagement: 'High' | 'Medium' | 'Low';
}

export const analyzeUrlWithGemini = async (url: string): Promise<GeminiAnalysisResult> => {
  try {
    // 1. Fetch page content using Jina Reader (bypasses anti-bot)
    // This allows us to get the actual page title, description, and content
    let pageContent = "";
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const response = await fetch(jinaUrl);
      if (response.ok) {
        const text = await response.text();
        pageContent = text.substring(0, 10000); // Limit context
      }
    } catch (fetchError) {
      console.warn("Failed to fetch page content, falling back to URL analysis:", fetchError);
    }

    const prompt = `
      Analyze the following URL and its content:
      URL: "${url}"
      
      Page Content (Markdown):
      ${pageContent}
      
      Based on the actual page content (if provided) or the URL structure:
      1. Extract the REAL page title (e.g., YouTube video title, Article headline). Do NOT hallucinate a generic title.
      2. Generate a short summary description.
      3. Create a short, unique 'slug' (max 8 chars, alphanumeric) relevant to the content.
      4. Generate 3 relevant tags.
      5. Determine the category.
      6. Analyze sentiment (Positive, Neutral, Negative).
      7. Predict engagement level.
      
      Return the response in JSON format matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedSlug: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            category: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            predictedEngagement: {
              type: Type.STRING,
              enum: ['High', 'Medium', 'Low']
            }
          },
          required: ['title', 'description', 'suggestedSlug', 'tags', 'category', 'sentiment', 'predictedEngagement']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiAnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return {
      title: "New Link",
      description: "No description available.",
      suggestedSlug: Math.random().toString(36).substring(2, 8),
      tags: ["general"],
      category: "Uncategorized",
      sentiment: "Neutral",
      predictedEngagement: "Medium"
    };
  }
};

export const generateSocialPost = async (linkData: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, viral tweet (max 280 chars) to promote this link. 
      Title: ${linkData.title}
      Description: ${linkData.description}
      Tags: ${linkData.tags.join(', ')}
      Target Audience: General Tech/Web users.
      Include hashtags.`,
    });
    return response.text || "Check out this link!";
  } catch (e) {
    console.error(e);
    return "Check out this link!";
  }
}

export interface ProductDetails {
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  try {
    // 1. Fetch page content using Jina Reader (bypasses anti-bot)
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl);

    if (!response.ok) {
      throw new Error(`Jina fetch failed: ${response.status}`);
    }

    const markdown = await response.text();

    // 2. Analyze with Gemini
    const prompt = `
      Extract product details from the following markdown content.
      
      Content:
      ${markdown.substring(0, 20000)} // Limit context window if needed
      
      Return a JSON object with:
      - name (string): The product title. Clean up any "Buy ... Online" prefixes.
      - description (string): A short, engaging description (max 200 chars).
      - price (number): The numeric price value. IMPORTANT: Handle formats like "₹1,299" or "Rs. 999". Remove commas and currency symbols. Return just the number (e.g., 1299).
      - currency (string): The currency code (e.g., INR, USD). If you see "₹" or "Rs", return "INR".
      - imageUrl (string): The URL of the main product image. Look for high-res images if possible.
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
          required: ['name', 'description', 'price', 'currency', 'imageUrl']
        }
      }
    });

    const text = aiResponse.text;
    if (!text) return null;

    return JSON.parse(text) as ProductDetails;
  } catch (error) {
    console.error("Product extraction failed:", error);
    return null;
  }
};
