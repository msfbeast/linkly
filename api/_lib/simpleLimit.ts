import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * A per-key sliding-window limit on Upstash, for endpoints anyone can call
 * (reports, client error logs). Fails open: without Redis, or if Redis is
 * down, requests are allowed and the problem is logged.
 */
type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

export interface SimpleLimit {
    allow(key: string): Promise<{ ok: boolean; retryAfter?: number }>;
    /** For tests: replace the limiter (null = no limit, undefined = real one). */
    setForTests(l: Limiter | null | undefined): void;
}

export function simpleLimit(prefix: string, count: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): SimpleLimit {
    let limiter: Limiter | null | undefined;
    const get = (): Limiter | null => {
        if (limiter !== undefined) return limiter;
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return (limiter = null);
        try {
            limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(count, window), prefix: `ratelimit:${prefix}` });
        } catch (e) {
            console.error(`[${prefix}] Rate limiter unavailable:`, e);
            limiter = null;
        }
        return limiter;
    };
    return {
        async allow(key) {
            const l = get();
            if (!l) return { ok: true };
            try {
                const { success, reset } = await l.limit(key);
                return success ? { ok: true } : { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
            } catch (e) {
                console.error(`[${prefix}] Rate limit check failed, allowing:`, e);
                return { ok: true };
            }
        },
        setForTests(l) { limiter = l; },
    };
}
