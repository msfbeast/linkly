import { describe, it, expect, vi } from 'vitest';
import { announceLinkLimit, isLinkLimitError, LINK_LIMIT_EVENT, LinkLimitError } from '../linkLimit';
import { execute } from '../../services/retryService';

describe('linkLimit', () => {
    it('recognises the database limit error, in any shape', () => {
        expect(isLinkLimitError({ message: 'Link limit reached for Free Tier. Please upgrade to create more links.' })).toBe(true);
        expect(isLinkLimitError(new Error('link limit reached for free tier'))).toBe(true);
        expect(isLinkLimitError(new LinkLimitError())).toBe(true);
        expect(isLinkLimitError(new Error('duplicate key value'))).toBe(false);
        expect(isLinkLimitError(null)).toBe(false);
    });

    it('says how many links the free plan has', () => {
        expect(new LinkLimitError().message).toBe("You've used all 50 links on the Free plan.");
    });

    it('announces on window', () => {
        const seen = vi.fn();
        window.addEventListener(LINK_LIMIT_EVENT, seen);
        announceLinkLimit();
        window.removeEventListener(LINK_LIMIT_EVENT, seen);
        expect(seen).toHaveBeenCalledTimes(1);
    });

    it('is not retried', async () => {
        const op = vi.fn().mockRejectedValue(new LinkLimitError());
        await expect(execute(op, { maxRetries: 3, baseDelayMs: 1 })).rejects.toBeInstanceOf(LinkLimitError);
        expect(op).toHaveBeenCalledTimes(1);
    });
});
