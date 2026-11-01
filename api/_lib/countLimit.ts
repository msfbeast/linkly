import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Caps how often one visitor can bump one counter (a link's clicks, a bio
 * page's views). Counting has to stay public, so it can't be made
 * impossible to inflate, only slow: a script hammering one link from one
 * address stops adding to the count after CLICKS_PER_MINUTE.
 *
 * Keyed by the keyed IP hash (never the raw IP) plus the target id. Fails
 * open, so a Redis outage loses the cap, not the clicks.
 */

export const CLICKS_PER_MINUTE = 10;
export const BIO_VIEWS_PER_10_MIN = 3;

type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

const limiters: Partial<Record<'click' | 'bio', Limiter | null>> = {};

function getLimiter(kind: 'click' | 'bio'): Limiter | null {
    if (kind in limiters) return limiters[kind] ?? null;
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        limiters[kind] = null; // not configured (local dev, tests)
        return null;
    }
    try {
        limiters[kind] = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: kind === 'click'
                ? Ratelimit.slidingWindow(CLICKS_PER_MINUTE, '60 s')
                : Ratelimit.slidingWindow(BIO_VIEWS_PER_10_MIN, '600 s'),
            prefix: `ratelimit:count:${kind}`,
        });
    } catch (e) {
        console.error('[count] Rate limiter unavailable (missing Upstash env?):', e);
        limiters[kind] = null;
    }
    return limiters[kind] ?? null;
}

/** For tests. */
export function setCountLimiterForTests(kind: 'click' | 'bio', l: Limiter | null | undefined) {
    if (l === undefined) delete limiters[kind];
    else limiters[kind] = l;
}

/** Whether this visitor's hit on this target should be counted. */
export async function shouldCount(kind: 'click' | 'bio', targetId: string, ipHash: string | null): Promise<boolean> {
    if (!ipHash) return true; // nothing to key on; count it
    const l = getLimiter(kind);
    if (!l) return true;
    try {
        const { success } = await l.limit(`${targetId}:${ipHash}`);
        return success;
    } catch (e) {
        console.error('[count] Rate limiter error (failing open):', e);
        return true;
    }
}
