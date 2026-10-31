/**
 * Razorpay plan IDs -> subscription tier.
 *
 * Shared by the Pricing page (to pick a plan) and the server (to decide what
 * tier a paid subscription grants). The server never trusts a tier sent by
 * the client or stored in Razorpay notes; it derives it from the plan_id.
 */
export type PaidTier = 'pro' | 'business';

export const RAZORPAY_PLANS = {
    INR: {
        monthly: { pro: 'plan_RuwgZWy5U7TtRf', business: 'plan_RuwhIlSY4xmePl' },
        yearly: { pro: 'plan_Ruwh4kaj1GtTia', business: 'plan_RuwhesYYL42H6Q' },
    },
} as const;

const PLAN_TO_TIER: Record<string, PaidTier> = Object.fromEntries(
    Object.values(RAZORPAY_PLANS).flatMap(periods =>
        Object.values(periods).flatMap(tiers =>
            Object.entries(tiers).map(([tier, planId]) => [planId, tier as PaidTier])
        )
    )
);

export function tierForPlan(planId: string | null | undefined): PaidTier | null {
    if (!planId) return null;
    return PLAN_TO_TIER[planId] ?? null;
}
