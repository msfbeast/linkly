/**
 * Background job to cleanup expired guest links
 * Should be run daily via cron or scheduled function
 */

import { supabaseAdapter } from './services/storage/supabaseAdapter';

export async function cleanupExpiredGuestLinks() {
    console.log('[Cleanup] Starting expired guest links cleanup...');

    try {
        const deletedCount = await supabaseAdapter.cleanupExpiredGuestLinks();
        console.log(`[Cleanup] Successfully deleted ${deletedCount} expired guest links`);

        return {
            success: true,
            deletedCount,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[Cleanup] Failed to cleanup expired guest links:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Send Day 5 reminder emails
 * Finds guest links created 5 days ago and sends reminder emails
 */
export async function sendDay5Reminders() {
    console.log('[Email] Sending Day 5 reminder emails...');

    // TODO: Implement email sending logic
    // 1. Query links created 5 days ago
    // 2. For each link, send reminder email
    // 3. Track sent emails to avoid duplicates

    return {
        success: true,
        emailsSent: 0,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Send Day 7 expiry warning emails
 * Finds guest links expiring tomorrow and sends warning emails
 */
export async function sendDay7Warnings() {
    console.log('[Email] Sending Day 7 expiry warnings...');

    // TODO: Implement email sending logic
    // 1. Query links expiring tomorrow
    // 2. For each link, send warning email
    // 3. Track sent emails to avoid duplicates

    return {
        success: true,
        emailsSent: 0,
        timestamp: new Date().toISOString(),
    };
}

// If running as standalone script
if (require.main === module) {
    cleanupExpiredGuestLinks()
        .then((result) => {
            console.log('Cleanup result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Cleanup failed:', error);
            process.exit(1);
        });
}
