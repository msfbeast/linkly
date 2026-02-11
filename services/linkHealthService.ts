import { LinkData } from '../types';

interface HealthCheckResult {
    status: 'healthy' | 'broken' | 'unknown';
    statusCode?: number;
    lastChecked: number;
}

// Persistent cache to avoid hitting API limits across sessions
const CACHE_KEY = 'gather_health_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour for persistence

interface HealthCacheEntry extends HealthCheckResult {
    expiry: number;
}

const getStoredCache = (): Record<string, HealthCacheEntry> => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

const saveToCache = (url: string, result: HealthCheckResult) => {
    const cache = getStoredCache();
    cache[url] = { ...result, expiry: Date.now() + CACHE_DURATION };

    // Cleanup expired entries while we're at it
    const now = Date.now();
    const cleanCache: Record<string, HealthCacheEntry> = {};
    Object.entries(cache).forEach(([key, val]) => {
        if (val.expiry > now) cleanCache[key] = val;
    });

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cleanCache));
    } catch (e) {
        console.warn('Failed to save health cache to localStorage', e);
    }
};

// Queue Implementation with Global Cooldown to prevent 429s
interface QueueItem {
    url: string;
    resolve: (result: HealthCheckResult) => void;
}

const queue: QueueItem[] = [];
let isProcessing = false;
let globalCooldownUntil = 0;
const CONCURRENCY = 1; // Extremely conservative
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds between requests
const COOLDOWN_DURATION = 60000; // 1 minute pause on 429

const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    while (queue.length > 0) {
        // Check global cooldown
        if (Date.now() < globalCooldownUntil) {
            const waitTime = globalCooldownUntil - Date.now();
            console.warn(`Health check queue paused for ${Math.round(waitTime / 1000)}s due to cooldown`);
            await new Promise(r => setTimeout(r, Math.min(waitTime, 5000)));
            continue;
        }

        const itemsToProcess = queue.splice(0, CONCURRENCY);

        await Promise.all(itemsToProcess.map(async (item) => {
            try {
                const result = await performHealthCheck(item.url);
                item.resolve(result);
            } catch (error) {
                item.resolve({ status: 'unknown', lastChecked: Date.now() });
            }
        }));

        if (queue.length > 0) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
        }
    }

    isProcessing = false;
};

const performHealthCheck = async (url: string): Promise<HealthCheckResult> => {
    try {
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&filter=statusCode`);

        if (response.status === 429) {
            console.error(`Microlink API 429: Global cooldown triggered for ${COOLDOWN_DURATION / 1000}s`);
            globalCooldownUntil = Date.now() + COOLDOWN_DURATION;
            return { status: 'unknown', lastChecked: Date.now() };
        }

        if (!response.ok) {
            console.warn(`Microlink API returned ${response.status} for ${url}, marking as unknown`);
            return { status: 'unknown', lastChecked: Date.now() };
        }

        const data = await response.json();

        if (data.status === 'success') {
            const statusCode = data.statusCode || 200;
            const result: HealthCheckResult = {
                status: statusCode >= 400 ? 'broken' : 'healthy',
                statusCode: statusCode,
                lastChecked: Date.now()
            };
            saveToCache(url, result);
            return result;
        }

        return { status: 'unknown', lastChecked: Date.now() };
    } catch (error) {
        return { status: 'unknown', lastChecked: Date.now() };
    }
};

export const checkLinkHealth = async (url: string): Promise<HealthCheckResult> => {
    if (!url) return { status: 'unknown', lastChecked: Date.now() };

    if (url.startsWith('widget://')) return { status: 'healthy', lastChecked: Date.now() };
    if (!url.startsWith('http://') && !url.startsWith('https://')) return { status: 'unknown', lastChecked: Date.now() };

    // Skip health checks for problematic/high-traffic domains that Microlink struggle with
    const skipDomains = ['drive.google.com', 'trends.withgoogle.com', 'canva.com', 'elevenlabs.io'];
    try {
        const hostname = new URL(url).hostname;
        if (skipDomains.some(d => hostname.includes(d))) {
            return { status: 'healthy', lastChecked: Date.now() }; // Assume healthy to avoid wasting quota
        }
    } catch { /* ignore */ }

    // Check persistent cache
    const cache = getStoredCache();
    const cached = cache[url];
    if (cached && cached.expiry > Date.now()) {
        return cached;
    }

    // Add to queue
    return new Promise((resolve) => {
        queue.push({ url, resolve });
        processQueue();
    });
};

export const getHealthColor = (status: 'healthy' | 'broken' | 'unknown') => {
    switch (status) {
        case 'healthy': return 'bg-emerald-500';
        case 'broken': return 'bg-red-500';
        case 'unknown': return 'bg-stone-300';
    }
};

export const getHealthTooltip = (status: 'healthy' | 'broken' | 'unknown') => {
    switch (status) {
        case 'healthy': return 'Link is active and reachable';
        case 'broken': return 'Link appears to be broken or unreachable';
        case 'unknown': return 'Checking link status...';
    }
};
