import { getRedisClient } from './redisClient';
import { supabaseAdapter } from './storage/supabaseAdapter';
import { LinkData } from '../types';

/**
 * Cache Service for Link Redirects
 * Provides high-performance caching layer for link lookups
 */

const CACHE_PREFIX = 'gather:link:';
const CACHE_TTL = 86400; // 24 hours in seconds

interface CachedLink {
    id: string;
    destination_url: string;
    user_id: string;
    status: string;
    title?: string;
}

/**
 * Get link by short code (cache-first)
 */
export async function getLinkByShortCode(shortCode: string): Promise<LinkData | null> {
    const redis = getRedisClient();

    // Try cache first
    if (redis) {
        try {
            const cacheKey = `${CACHE_PREFIX}${shortCode}`;
            const cached = await redis.get(cacheKey);

            if (cached) {
                console.log(`[Cache HIT] ${shortCode}`);
                return JSON.parse(cached) as LinkData;
            }

            console.log(`[Cache MISS] ${shortCode}`);
        } catch (error) {
            console.error('Redis get error:', error);
            // Fall through to database
        }
    }

    // Cache miss or Redis unavailable - query database
    const links = await supabaseAdapter.getLinks();
    const link = links.find(l => l.shortCode === shortCode);

    if (link && redis) {
        // Store in cache for next time
        try {
            await setLinkCache(shortCode, link);
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    return link || null;
}

/**
 * Store link in cache
 */
export async function setLinkCache(shortCode: string, link: LinkData): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const cacheKey = `${CACHE_PREFIX}${shortCode}`;
        const cacheData: CachedLink = {
            id: link.id,
            destination_url: link.originalUrl,
            user_id: '', // Not stored in LinkData, will need to fetch if needed
            status: 'active', // LinkData doesn't have status field
            title: link.title,
        };

        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cacheData));
        console.log(`[Cache SET] ${shortCode}`);
    } catch (error) {
        console.error('Failed to set cache:', error);
    }
}

/**
 * Invalidate link cache (when link is updated/deleted)
 */
export async function invalidateLinkCache(shortCode: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const cacheKey = `${CACHE_PREFIX}${shortCode}`;
        await redis.del(cacheKey);
        console.log(`[Cache INVALIDATE] ${shortCode}`);
    } catch (error) {
        console.error('Failed to invalidate cache:', error);
    }
}

/**
 * Warm cache with popular links
 */
export async function warmCache(links: LinkData[]): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    console.log(`[Cache WARM] Warming cache with ${links.length} links`);

    const promises = links.map(link => setLinkCache(link.shortCode, link));
    await Promise.allSettled(promises);

    console.log('[Cache WARM] Complete');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ keys: number; memory: string } | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const keys = await redis.keys(`${CACHE_PREFIX}*`);
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

        return {
            keys: keys.length,
            memory,
        };
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        return null;
    }
}
