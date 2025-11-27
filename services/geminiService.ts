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
    const prompt = `
      Analyze the following URL: "${url}".
      
      Based on the URL structure and common knowledge about the domain (if known), 
      generate a catchy title, a short summary description, a short and unique 'slug' (max 8 chars, alphanumeric), 
      3 relevant tags, a general category, sentiment (Positive, Neutral, Negative), and predicted engagement level.
      
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
