import { supabase } from './storage/supabaseClient';

/**
 * Transactional emails. The server owns templates and recipients
 * (see api/send-email.ts); the client only names which email to send.
 */
async function postEmail(payload: Record<string, unknown>): Promise<boolean> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            // No session yet (e.g. email confirmation pending) — skip quietly.
            return false;
        }

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Email API Error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Email Send Error:', error);
        return false;
    }
}

class EmailService {
    /** Sends the welcome email to the signed-in user's own address. */
    async sendWelcomeEmail() {
        return postEmail({ type: 'welcome' });
    }

    /** Sends the invite email for a team invite the signed-in user created. */
    async sendInviteEmail(inviteId: string) {
        return postEmail({ type: 'invite', inviteId });
    }
}

export const emailService = new EmailService();
