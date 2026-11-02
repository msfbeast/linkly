/**
 * Crash-safe price formatter for storefronts and checkout.
 *
 * Legacy products can have an empty/invalid currency code, and
 * Intl.NumberFormat throws a RangeError on invalid codes — which used to
 * white-screen entire storefront templates. Defaults to INR (primary
 * market) when the currency is missing.
 */
export const formatPrice = (price: number, currency?: string | null): string => {
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            // Whole amounts without ".00": ₹499, $9.50.
            minimumFractionDigits: Number.isInteger(Number(price)) ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(price);
    } catch {
        return `${currency || ''} ${Number(price).toFixed(2)}`.trim();
    }
};
