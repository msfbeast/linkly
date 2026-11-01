/**
 * The claim token of the guest link this browser made, kept until the
 * visitor signs in so the link can be added to their account then, whether
 * they register, log in, use Google/GitHub or confirm their email first.
 */
const KEY = 'gather_pending_claim';

export function getPendingClaim(): string | null {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
}

export function setPendingClaim(token: string): void {
    try {
        localStorage.setItem(KEY, token);
    } catch {
        // storage blocked: the claim button on the result still works
    }
}

export function clearPendingClaim(): void {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // nothing to clear
    }
}
