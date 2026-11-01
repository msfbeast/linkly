import { tierForPlan, type PaidTier } from '../../utils/razorpayPlans';

/**
 * Maps a Razorpay subscription webhook event to the profile update it
 * should cause, or null to ignore it.
 *
 * - activated / charged / resumed: grant the plan's tier (never trust notes).
 * - pending (a renewal charge failed, Razorpay is retrying): keep the tier,
 *   mark the account past_due.
 * - halted (retries exhausted) / cancelled / completed / paused / expired:
 *   back to free.
 *
 * Downgrade and past_due events only apply to the subscription the profile
 * is currently on. Otherwise cancelling an old subscription after switching
 * plans (say Pro to Business) would wipe out the new one.
 */

export interface RazorpaySubscriptionEntity {
    id?: string;
    plan_id?: string;
    notes?: { userId?: string } | null;
}

export interface ProfileUpdate {
    subscription_tier?: PaidTier | 'free';
    subscription_status: 'active' | 'past_due' | 'canceled';
    razorpay_subscription_id?: string;
}

const GRANT_EVENTS = new Set(['subscription.activated', 'subscription.charged', 'subscription.resumed']);
const PAST_DUE_EVENTS = new Set(['subscription.pending']);
const REVOKE_EVENTS = new Set([
    'subscription.halted',
    'subscription.cancelled',
    'subscription.completed',
    'subscription.paused',
    'subscription.expired',
]);

export function isSubscriptionEvent(eventName: string): boolean {
    return GRANT_EVENTS.has(eventName) || PAST_DUE_EVENTS.has(eventName) || REVOKE_EVENTS.has(eventName);
}

export function profileUpdateForEvent(
    eventName: string,
    subscription: RazorpaySubscriptionEntity | undefined,
    currentSubscriptionId: string | null | undefined,
): ProfileUpdate | null {
    if (!subscription?.id) return null;

    if (GRANT_EVENTS.has(eventName)) {
        const tier = tierForPlan(subscription.plan_id);
        if (!tier) return null;
        return {
            subscription_tier: tier,
            subscription_status: 'active',
            razorpay_subscription_id: subscription.id,
        };
    }

    // A profile with no stored id predates storing it; let its events through.
    const isCurrent = !currentSubscriptionId || currentSubscriptionId === subscription.id;
    if (!isCurrent) return null;

    if (PAST_DUE_EVENTS.has(eventName)) {
        return { subscription_status: 'past_due' };
    }

    if (REVOKE_EVENTS.has(eventName)) {
        return { subscription_tier: 'free', subscription_status: 'canceled' };
    }

    return null;
}
