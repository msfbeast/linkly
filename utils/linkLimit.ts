import { FREE_LINK_LIMIT } from './planLimits';

/** Fired on window when a free account hits its link limit; DashboardLayout shows the upgrade prompt. */
export const LINK_LIMIT_EVENT = 'gather:link-limit';

/** The database refused a new link because the free plan's limit is used up. Not worth retrying. */
export class LinkLimitError extends Error {
    readonly permanent = true;
    constructor() {
        super(`You've used all ${FREE_LINK_LIMIT} links on the Free plan.`);
        this.name = 'LinkLimitError';
    }
}

/** Whether an error is the database's free-plan limit (enforce_free_link_limit). */
export function isLinkLimitError(err: unknown): boolean {
    if (err instanceof LinkLimitError) return true;
    const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
    return /link limit reached/i.test(message);
}

export function announceLinkLimit(): void {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(LINK_LIMIT_EVENT));
}
