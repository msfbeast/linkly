import { LinkData } from '../types';

interface HealthCheckResult {
    status: 'healthy' | 'broken' | 'unknown';
    statusCode?: number;
    lastChecked: number;
}

// Simple in-memory cache to avoid hitting API limits
const healthCache: Record<string, HealthCheckResult> = {};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export const checkLinkHealth = async (url: string): Promise<HealthCheckResult> => {
    if (!url) return { status: 'unknown', lastChecked: Date.now() };

    // Skip health checks for internal widget URLs - they're not real links
    if (url.startsWith('widget://')) {
        return { status: 'healthy', lastChecked: Date.now() };
    }

    // Skip health checks for obviously invalid URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { status: 'unknown', lastChecked: Date.now() };
    }

    // Check cache
    const cached = healthCache[url];
    if (cached && (Date.now() - cached.lastChecked < CACHE_DURATION)) {
        return cached;
    }

    try {
        // Use Microlink API to check if the URL is reachable
        // We request 'statusCode' to get the HTTP status code
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&filter=statusCode`);

        // If Microlink API itself fails (400, 500, etc.), don't mark link as broken
        // This happens when Microlink can't fetch the URL (blocked by site, rate limited, etc.)
        if (!response.ok) {
            console.warn(`Microlink API returned ${response.status} for ${url}, marking as unknown`);
            return { status: 'unknown', lastChecked: Date.now() };
        }

        const data = await response.json();

        if (data.status === 'success') {
            // Check the actual HTTP status code of the target URL
            // Microlink returns it at the top level when using filter=statusCode
            const statusCode = data.statusCode || 200;

            if (statusCode >= 400) {
                const result: HealthCheckResult = {
                    status: 'broken',
                    statusCode: statusCode,
                    lastChecked: Date.now()
                };
                healthCache[url] = result;
                return result;
            }

            const result: HealthCheckResult = {
                status: 'healthy',
                statusCode: statusCode,
                lastChecked: Date.now()
            };
            healthCache[url] = result;
            return result;
        } else {
            // If Microlink returns fail status, mark as unknown (not broken)
            // The link might still be working - Microlink just couldn't check it
            console.warn(`Microlink failed to check ${url}, marking as unknown`);
            return { status: 'unknown', lastChecked: Date.now() };
        }
    } catch (error) {
        console.error('Error checking link health:', error);
        return { status: 'unknown', lastChecked: Date.now() };
    }
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
