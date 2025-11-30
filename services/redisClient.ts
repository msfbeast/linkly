import Redis from 'ioredis';

/**
 * Redis Client Singleton
 * Provides caching for link redirects and session management
 */

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
    // If Redis is not configured, return null (graceful degradation)
    if (!import.meta.env.VITE_REDIS_URL && !import.meta.env.REDIS_URL) {
        console.warn('Redis not configured. Caching disabled.');
        return null;
    }

    // Return existing client if already initialized
    if (redisClient) {
        return redisClient;
    }

    try {
        const redisUrl = import.meta.env.VITE_REDIS_URL || import.meta.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    // Reconnect on READONLY errors
                    return true;
                }
                return false;
            },
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('Redis Client Connected');
        });

        redisClient.on('ready', () => {
            console.log('Redis Client Ready');
        });

        return redisClient;
    } catch (error) {
        console.error('Failed to initialize Redis client:', error);
        return null;
    }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisClient(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
    return redisClient !== null && redisClient.status === 'ready';
}
