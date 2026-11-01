import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { getAdminClient, getUserFromRequest } from './_lib/supabaseServer';

/**
 * Transactional email endpoint.
 *
 * Callers never supply recipients or HTML. They pick a template, and the
 * server works out who receives it:
 * - { type: 'welcome' }           -> the signed-in user's own address, once
 *                                    per account and only after the email
 *                                    is confirmed
 * - { type: 'invite', inviteId }  -> the invitee of a team invite the
 *                                    signed-in user created
 */

const MAIN_ORIGINS = new Set([
    'https://gather.link',
    'https://app.gather.link',
    'https://gather-link.vercel.app',
    'https://links.trak.in',
    'http://localhost:3000',
    'http://localhost:5173',
]);

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function appOrigin(req: VercelRequest): string {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && MAIN_ORIGINS.has(origin)) return origin;
    return process.env.NEXT_PUBLIC_APP_URL || 'https://gather.link';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabase = getAdminClient();
    if (!process.env.RESEND_API_KEY || !supabase) {
        console.error('[Email] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, inviteId } = req.body || {};
    let to: string;
    let subject: string;
    let html: string;

    // Set when this request claimed the one-time welcome email, so a failed
    // send can release the claim and be retried on a later sign-in.
    let welcomeClaimed = false;

    if (type === 'welcome') {
        if (!user.email) return res.status(400).json({ error: 'No email on account' });
        if (!user.email_confirmed_at) {
            return res.status(400).json({ error: 'Email not confirmed yet' });
        }

        // Claim the welcome email atomically: only the first request for
        // this account gets a row back, so it is sent at most once.
        const { data: claimed, error: claimError } = await supabase
            .from('profiles')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', user.id)
            .is('welcome_email_sent_at', null)
            .select('id');

        if (claimError) {
            console.error('[Email] Could not claim welcome email (is the welcome_email_sent_at migration applied?):', claimError);
            return res.status(500).json({ error: 'Failed to send email' });
        }
        if (!claimed || claimed.length === 0) {
            return res.status(200).json({ skipped: 'already_sent' });
        }
        welcomeClaimed = true;

        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle();
        const name = escapeHtml(profile?.username || user.email.split('@')[0]);

        to = user.email;
        subject = 'Welcome to Gather! 🎉';
        html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Welcome, ${name}!</h1>
                <p>We're thrilled to have you onboard.</p>
                <p>Get started by setting up your bio page.</p>
            </div>
        `;
    } else if (type === 'invite') {
        if (!inviteId || typeof inviteId !== 'string') {
            return res.status(400).json({ error: 'Missing inviteId' });
        }
        const { data: invite } = await supabase
            .from('team_invites')
            .select('email, token, team_id, created_by, expires_at')
            .eq('id', inviteId)
            .maybeSingle();

        if (!invite || invite.created_by !== user.id) {
            return res.status(404).json({ error: 'Invite not found' });
        }
        if (new Date(invite.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ error: 'Invite expired' });
        }

        const { data: team } = await supabase
            .from('teams')
            .select('name')
            .eq('id', invite.team_id)
            .maybeSingle();
        const teamName = escapeHtml(team?.name || 'a team');
        const inviteUrl = `${appOrigin(req)}/team/invite/${encodeURIComponent(invite.token)}`;

        to = invite.email;
        subject = `You've been invited to join ${team?.name || 'a team'} on Gather`;
        html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Team Invitation</h1>
                <p>You have been invited to join the <strong>${teamName}</strong> team.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
                <p style="font-size: 12px; color: #666;">This link expires in 7 days.</p>
            </div>
        `;
    } else {
        return res.status(400).json({ error: 'Unknown email type' });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const { data, error } = await resend.emails.send({
            from: `Gather <${fromEmail}>`,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            await releaseWelcomeClaim();
            return res.status(502).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ data });
    } catch (error: any) {
        console.error('Email Send Error:', error);
        await releaseWelcomeClaim();
        return res.status(500).json({ error: 'Failed to send email' });
    }

    async function releaseWelcomeClaim() {
        if (!welcomeClaimed) return;
        await supabase!
            .from('profiles')
            .update({ welcome_email_sent_at: null })
            .eq('id', user!.id);
    }
}
