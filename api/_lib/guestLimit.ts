import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * How many links one visitor (keyed IP hash) can shorten without an
 * account. Guest links are free and anonymous, which makes them the
 * easiest way to mass-produce short links for spam or phishing.
 * Fails open if Redis is down or not configured, so the landing page
 * keeps working.
 */
export const GUEST_LINKS_PER_HOUR = 10;

type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

let limiter: Limiter | null | undefined;

function getLimiter(): Limiter | null {
    if (limiter !== undefined) return limiter;
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        limiter = null;
        return null;
    }
    try {
        limiter = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(GUEST_LINKS_PER_HOUR, '1 h'),
            prefix: 'ratelimit:guest-link',
        });
    } catch (e) {
        console.error('[guest-link] Rate limiter unavailable:', e);
        limiter = null;
    }
    return limiter;
}

/** For tests. */
export function setGuestLimiterForTests(l: Limiter | null | undefined) {
    limiter = l;
}

/** Whether this visitor may create another guest link now; seconds to wait when not. */
export async function allowGuestLink(visitor: string): Promise<{ ok: boolean; retryAfter?: number }> {
    const l = getLimiter();
    if (!l) return { ok: true };
    try {
        const { success, reset } = await l.limit(visitor);
        return success ? { ok: true } : { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
    } catch (e) {
        console.error('[guest-link] Rate limit check failed, allowing:', e);
        return { ok: true };
    }
}
