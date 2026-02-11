/**
 * Utility for handling affiliate tag injection
 */

interface AffiliateConfig {
    flipkartAffiliateId?: string;
    amazonAssociateTag?: string;
}

const sanitizeAffiliateId = (id: string | undefined): string | undefined => {
    if (!id) return undefined;

    let cleanId = id.trim();

    // Aggressive removal of common prefixes, including encoded variants
    const patterns = [
        /^[?&]+(tag|affid)=/i,
        /^%(3F|26)(tag|affid)%(3D|26)/i,
        /^(tag|affid)=/i
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of patterns) {
            if (pattern.test(cleanId)) {
                cleanId = cleanId.replace(pattern, '');
                changed = true;
            }
        }
    }

    return cleanId.trim();
};

export const monetizeUrl = (url: string, config: AffiliateConfig): string => {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        const amazonTag = sanitizeAffiliateId(config.amazonAssociateTag);
        const flipkartId = sanitizeAffiliateId(config.flipkartAffiliateId);

        // Flipkart
        if (hostname === 'flipkart.com' || hostname.endsWith('.flipkart.com')) {
            // Prioritize 'itm' identifier (Flipkart Serial Number)
            // It can be in the path or as a query param (pid=itm...) or just part of the string
            const itmMatch = url.match(/(itm[a-zA-Z0-9]+)/);

            if (itmMatch) {
                const pid = itmMatch[1];
                const cleanUrl = new URL(`https://www.flipkart.com/product/p/${pid}`);
                if (flipkartId) {
                    cleanUrl.searchParams.set('affid', flipkartId);
                }
                return cleanUrl.toString();
            }

            // Fallback to 'pid' param if no 'itm' found
            const pid = urlObj.searchParams.get('pid');
            if (pid) {
                const cleanUrl = new URL(`https://www.flipkart.com/product/p/${pid}`);
                if (flipkartId) {
                    cleanUrl.searchParams.set('affid', flipkartId);
                }
                return cleanUrl.toString();
            }

            // Fallback: Just append affid
            if (flipkartId) {
                urlObj.searchParams.set('affid', flipkartId);
                return urlObj.toString();
            }
        }

        // Amazon
        if (hostname === 'amazon.com' || hostname === 'amazon.in' || hostname.endsWith('.amazon.com') || hostname.endsWith('.amazon.in')) {
            // Robust ASIN extraction: /dp/ASIN or /gp/product/ASIN
            // Supports URLs with or without query params
            const asinMatch = url.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/);

            if (asinMatch) {
                const asin = asinMatch[1];
                // Strip www. for cleaner URL, but keep the TLD (com, in, co.uk)
                const cleanHostname = urlObj.hostname.replace('www.', '');
                const cleanUrl = new URL(`https://${cleanHostname}/dp/${asin}`); // Force clean path

                if (amazonTag) {
                    cleanUrl.searchParams.set('tag', amazonTag);
                }
                return cleanUrl.toString();
            }

            // Fallback: Just append tag if ASIN not found
            if (amazonTag) {
                urlObj.searchParams.set('tag', amazonTag);
                return urlObj.toString();
            }
        }

        return url;
    } catch (e) {
        // If URL is invalid, return original
        return url;
    }
};
