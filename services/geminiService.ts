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
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze URL');
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini analysis failed:", error);
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

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  // Placeholder or move to API
  return null;
};
