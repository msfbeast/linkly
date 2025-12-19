/**
 * Background job to cleanup expired guest links
 * Should be run daily via cron or scheduled function
 */

import { supabaseAdapter } from '../services/storage/supabaseAdapter';

export async function cleanupExpiredGuestLinks() {
    console.log('[App] Starting expired guest links cleanup...');

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

import { Resend } from 'resend';
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Day 5 reminder emails
 * Finds guest links created 5 days ago and sends reminder emails
 */
export async function sendDay5Reminders() {
    console.log('[Email] Sending Day 5 reminder emails...');

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

    const { data: links, error } = await (supabaseAdapter as any).supabase!
        .from('links')
        .select('*')
        .eq('is_guest', true)
        .gte('created_at', sixDaysAgo)
        .lte('created_at', fiveDaysAgo);

    if (error) {
        console.error('[Email] Failed to fetch links for reminders:', error);
        return { success: false, emailsSent: 0 };
    }

    let emailsSent = 0;
    for (const link of links || []) {
        const guestEmail = link.metadata?.guest_email;
        if (!guestEmail) continue;

        try {
            const claimUrl = `${process.env.VITE_APP_URL || 'https://gather.link'}/register?claim=${link.claim_token}`;

            await resend.emails.send({
                from: 'Gather <notifications@gather.link>',
                to: guestEmail,
                subject: `Your link got ${link.clicks} clicks! 🎉`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                        <h2 style="color: #1e293b;">Your link is doing great! 🎉</h2>
                        <p style="font-size: 18px; color: #64748b;">gather.link/${link.short_code}</p>
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <div style="font-size: 40px; font-weight: bold; color: #1e293b;">${link.clicks}</div>
                            <div style="color: #78350f;">Total Clicks</div>
                        </div>
                        <p>Your link has been clicked <strong>${link.clicks} times</strong> in the last 5 days!</p>
                        <p>Sign up now to keep it forever and unlock detailed analytics.</p>
                        <a href="${claimUrl}" style="display: inline-block; background: #facc15; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Claim Your Link (Free)</a>
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Your link expires in 2 days.</p>
                    </div>
                `
            });
            emailsSent++;
        } catch (err) {
            console.error(`[Email] Failed to send Day 5 reminder to ${guestEmail}:`, err);
        }
    }

    return {
        success: true,
        emailsSent,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Send Day 7 expiry warning emails
 * Finds guest links expiring tomorrow and sends warning emails
 */
export async function sendDay7Warnings() {
    console.log('[Email] Sending Day 7 expiry warnings...');

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: links, error } = await (supabaseAdapter as any).supabase!
        .from('links')
        .select('*')
        .eq('is_guest', true)
        .gte('expires_at', tomorrow)
        .lte('expires_at', dayAfterTomorrow);

    if (error) {
        console.error('[Email] Failed to fetch links for warnings:', error);
        return { success: false, emailsSent: 0 };
    }

    let emailsSent = 0;
    for (const link of links || []) {
        const guestEmail = link.metadata?.guest_email;
        if (!guestEmail) continue;

        try {
            const claimUrl = `${process.env.VITE_APP_URL || 'https://gather.link'}/register?claim=${link.claim_token}`;

            await resend.emails.send({
                from: 'Gather <notifications@gather.link>',
                to: guestEmail,
                subject: `⏰ Your link expires today`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecaca; border-radius: 12px;">
                        <h2 style="color: #991b1b;">⏰ Your link expires today</h2>
                        <p style="font-size: 18px; color: #64748b;">gather.link/${link.short_code}</p>
                        <p>Your link will stop working in 24 hours. Sign up now to save it and keep all your analytics.</p>
                        ${link.clicks > 0 ? `<p>Don't lose your <strong>${link.clicks} clicks</strong> of data!</p>` : ''}
                        <a href="${claimUrl}" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Save My Link Now</a>
                    </div>
                `
            });
            emailsSent++;
        } catch (err) {
            console.error(`[Email] Failed to send Day 7 warning to ${guestEmail}:`, err);
        }
    }

    return {
        success: true,
        emailsSent,
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
