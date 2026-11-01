import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getUserFromRequest } from './supabaseServer';

/**
 * Shared gate for the AI endpoints (api/ai/*). Every call costs Gemini
 * quota and signup is free, so each request needs a signed-in user, a
 * per-user rate limit and bounded input.
 */

export const AI_LIMIT_PER_HOUR = 60;
export const MAX_URL_LENGTH = 2048;
export const MAX_TEXT_LENGTH = 500;

type Limiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };

let limiter: Limiter | null | undefined;
function getLimiter(): Limiter | null {
    if (limiter !== undefined) return limiter;
    try {
        limiter = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(AI_LIMIT_PER_HOUR, '1 h'),
            prefix: 'ratelimit:ai',
        });
    } catch (e) {
        console.error('[AI] Rate limiter unavailable (missing Upstash env?):', e);
        limiter = null;
    }
    return limiter;
}

/** For tests. */
export function setAiLimiterForTests(l: Limiter | null | undefined) {
    limiter = l;
}

/**
 * Returns the user, or sends the error response and returns null.
 * Fails open if Redis itself is down (as api/v1 does), so an outage there
 * doesn't take AI features down with it; it is logged.
 */
export async function requireAiUser(req: VercelRequest, res: VercelResponse): Promise<User | null> {
    const user = await getUserFromRequest(req);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    const l = getLimiter();
    if (l) {
        try {
            const { success, reset } = await l.limit(user.id);
            if (!success) {
                res.setHeader('Retry-After', String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))));
                res.status(429).json({ error: 'AI limit reached. Please try again later.' });
                return null;
            }
        } catch (e) {
            console.error('[AI] Rate limiter error (failing open):', e);
        }
    }
    return user;
}

/** A required http(s) URL of sane length, or null. */
export function validUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length === 0 || value.length > MAX_URL_LENGTH) return null;
    try {
        const u = new URL(value.trim());
        return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
    } catch {
        return null;
    }
}

/** Optional free text, trimmed to MAX_TEXT_LENGTH; '' when absent. */
export function boundedText(value: unknown): string {
    return typeof value === 'string' ? value.slice(0, MAX_TEXT_LENGTH) : '';
}
