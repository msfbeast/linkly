import { Link } from '../types';

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

    // Check cache
    const cached = healthCache[url];
    if (cached && (Date.now() - cached.lastChecked < CACHE_DURATION)) {
        return cached;
    }

    try {
        // Use Microlink API to check if the URL is reachable
        // We request 'statusCode' to get the HTTP status code
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&filter=statusCode`);
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
            // If Microlink fails, it usually means the site is down or unreachable
            const result: HealthCheckResult = {
                status: 'broken',
                statusCode: data.code || 0,
                lastChecked: Date.now()
            };
            healthCache[url] = result;
            return result;
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
