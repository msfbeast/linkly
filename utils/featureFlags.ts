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

    /** Team workspaces (switcher, team settings, invites). Parked: the
     *  product is short links, a store page and analytics for one owner. */
    TEAMS: envFlag(import.meta.env.VITE_FEATURE_TEAMS, false),

    /** Selling digital files with checkout. Parked: the store lists
     *  product links to other sites; nothing is sold here. */
    DIGITAL_PRODUCTS: envFlag(import.meta.env.VITE_FEATURE_DIGITAL_PRODUCTS, false),

    /** "Media Gallery" link type (photo sample pages). Parked: existing
     *  gallery links keep working, new ones can't be created. */
    MEDIA_GALLERY: envFlag(import.meta.env.VITE_FEATURE_MEDIA_GALLERY, false),

    /** Photo gallery block on bio pages. Parked with the other bio extras. */
    BIO_GALLERY: envFlag(import.meta.env.VITE_FEATURE_BIO_GALLERY, false),

    /** Payments. Razorpay is the only provider. */
    PAYMENTS_RAZORPAY: envFlag(import.meta.env.VITE_FEATURE_RAZORPAY, true),
} as const;
