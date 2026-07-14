/**
 * Central feature flags.
 *
 * "Parked" features are complete (or near-complete) but intentionally
 * switched off to reduce maintenance surface while the platform is
 * internal-only. Flip a flag (or set the matching VITE_ env var to "true")
 * to re-enable — no code archaeology required.
 */

const envFlag = (value: string | undefined, fallback: boolean): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
};

export const FEATURES = {
    /** Agency/client dashboard. Parked: single-operator deployment. */
    AGENCY_DASHBOARD: envFlag(import.meta.env.VITE_FEATURE_AGENCY, false),

    /** Link A/B testing. Parked: revisit once core analytics are trusted. */
    AB_TESTING: envFlag(import.meta.env.VITE_FEATURE_AB_TESTING, false),

    /**
     * Payment providers. Razorpay is the single active provider.
     * Stripe/Cashfree parked until public launch. Server endpoints are
     * gated separately via ENABLE_STRIPE / ENABLE_CASHFREE env vars.
     */
    PAYMENTS_RAZORPAY: envFlag(import.meta.env.VITE_FEATURE_RAZORPAY, true),
    PAYMENTS_STRIPE: envFlag(import.meta.env.VITE_FEATURE_STRIPE, false),
    PAYMENTS_CASHFREE: envFlag(import.meta.env.VITE_FEATURE_CASHFREE, false),
} as const;
