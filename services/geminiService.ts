import { supabase } from './storage/supabaseClient';
import { titleFromUrl } from '../utils/urlTitle';

export interface GeminiAnalysisResult {
  title: string;
  description: string;
  suggestedSlug: string;
  tags: string[];
  category: string;
  sentiment: string;
  predictedEngagement: 'High' | 'Medium' | 'Low';
}

export interface ProductDetails {
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

/**
 * All Gemini calls are routed through authenticated server endpoints
 * (/api/ai/*) so the GEMINI_API_KEY is never shipped to the browser.
 */

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

const generateSlugFallback = (): string => {
  // Non-security-critical UI fallback slug
  return Math.random().toString(36).substring(2, 8);
};

export const analyzeUrlWithGemini = async (url: string): Promise<GeminiAnalysisResult> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      return await response.json();
    }

    // The API returns a usable fallback payload on failure
    try {
      const errBody = await response.json();
      if (errBody?.fallback) return errBody.fallback as GeminiAnalysisResult;
    } catch { /* ignore parse errors */ }

    throw new Error(`Analyze API failed with status ${response.status}`);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: titleFromUrl(url),
      description: "",
      suggestedSlug: generateSlugFallback(),
      tags: ["general"],
      category: "Uncategorized",
      sentiment: "Neutral",
      predictedEngagement: "Low" as const
    };
  }
};

// Social Post Generation (Placeholder - should move to API)
export const generateSocialPost = async (linkData: any): Promise<string> => {
  return `Check out this link: ${linkData.title} #gather`;
};

export const generateLinkMetadata = async (url: string, currentTitle?: string): Promise<{ title: string, description: string }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'link_metadata', url, currentTitle }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || currentTitle || titleFromUrl(url),
        description: data.description || ""
      };
    }
    return { title: currentTitle || titleFromUrl(url), description: "" };
  } catch (error) {
    console.error("Smart Link Metadata generation failed:", error);
    return { title: currentTitle || titleFromUrl(url), description: "" };
  }
};

export const generateBio = async (keywords: string, currentBio?: string): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'bio', keywords, currentBio }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.bio || currentBio || "";
    }
    return currentBio || "";
  } catch (error) {
    console.error("Bio generation failed:", error);
    return currentBio || "";
  }
};

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/ai/extract_product', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      return await response.json();
    }
    console.warn('Product extraction API failed:', response.status);
    return null;
  } catch (error) {
    console.error("Product extraction failed:", error);
    return null;
  }
};

// NOTE: chatWithProfile and generateBackgroundImage were retired in the
// 2026-07 feature cut (AI garnish). Recover from git history if needed.
