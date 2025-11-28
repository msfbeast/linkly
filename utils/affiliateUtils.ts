/**
 * Utility for handling affiliate tag injection
 */

interface AffiliateConfig {
    flipkartAffiliateId?: string;
    amazonAssociateTag?: string;
}

export const monetizeUrl = (url: string, config: AffiliateConfig): string => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');

        // Flipkart
        if (config.flipkartAffiliateId && (hostname === 'flipkart.com' || hostname.endsWith('.flipkart.com'))) {
            // Remove existing affiliate params to be safe, or just append ours?
            // Usually affiliate params are 'affid' or 'tag'.
            // Flipkart uses 'affid' usually.
            urlObj.searchParams.set('affid', config.flipkartAffiliateId);
            return urlObj.toString();
        }

        // Amazon
        if (config.amazonAssociateTag && (hostname === 'amazon.com' || hostname === 'amazon.in' || hostname.endsWith('.amazon.com') || hostname.endsWith('.amazon.in'))) {
            // Amazon uses 'tag'
            urlObj.searchParams.set('tag', config.amazonAssociateTag);
            return urlObj.toString();
        }

        return url;
    } catch (e) {
        // If URL is invalid, return original
        return url;
    }
};
