import { describe, it, expect } from 'vitest';
import { isSubscriptionEvent, profileUpdateForEvent } from '../razorpaySubscriptionEvents';
import { RAZORPAY_PLANS } from '../../../utils/razorpayPlans';

const PRO = RAZORPAY_PLANS.INR.monthly.pro;
const BUSINESS = RAZORPAY_PLANS.INR.yearly.business;
const sub = (id: string, plan_id: string = PRO) => ({ id, plan_id, notes: { userId: 'u1' } });

describe('profileUpdateForEvent', () => {
    it('grants the plan tier on activated, charged and resumed', () => {
        for (const e of ['subscription.activated', 'subscription.charged', 'subscription.resumed']) {
            expect(profileUpdateForEvent(e, sub('sub_1', BUSINESS), null)).toEqual({
                subscription_tier: 'business',
                subscription_status: 'active',
                razorpay_subscription_id: 'sub_1',
            });
        }
    });

    it('ignores grants for plans we do not know', () => {
        expect(profileUpdateForEvent('subscription.charged', sub('sub_1', 'plan_unknown'), null)).toBeNull();
    });

    it('downgrades to free when the current subscription ends', () => {
        for (const e of [
            'subscription.cancelled',
            'subscription.halted',
            'subscription.completed',
            'subscription.paused',
            'subscription.expired',
        ]) {
            expect(profileUpdateForEvent(e, sub('sub_1'), 'sub_1')).toEqual({
                subscription_tier: 'free',
                subscription_status: 'canceled',
            });
        }
    });

    it('marks past_due but keeps the tier while a renewal is being retried', () => {
        expect(profileUpdateForEvent('subscription.pending', sub('sub_1'), 'sub_1')).toEqual({
            subscription_status: 'past_due',
        });
    });

    it('does not downgrade when an old subscription is cancelled after a plan switch', () => {
        // User moved from sub_old (Pro) to sub_new (Business), then sub_old was cancelled.
        expect(profileUpdateForEvent('subscription.cancelled', sub('sub_old'), 'sub_new')).toBeNull();
        expect(profileUpdateForEvent('subscription.pending', sub('sub_old'), 'sub_new')).toBeNull();
    });

    it('applies downgrades to profiles that predate storing the subscription id', () => {
        expect(profileUpdateForEvent('subscription.cancelled', sub('sub_1'), null)).toEqual({
            subscription_tier: 'free',
            subscription_status: 'canceled',
        });
    });

    it('ignores events without a subscription id, and unrelated events', () => {
        expect(profileUpdateForEvent('subscription.cancelled', undefined, null)).toBeNull();
        expect(profileUpdateForEvent('subscription.cancelled', { plan_id: PRO }, null)).toBeNull();
        expect(isSubscriptionEvent('payment.captured')).toBe(false);
        expect(isSubscriptionEvent('subscription.authenticated')).toBe(false);
        expect(isSubscriptionEvent('subscription.cancelled')).toBe(true);
    });
});
