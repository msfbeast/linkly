import { createClient } from '@supabase/supabase-js';

// Email Provider Interface
export interface EmailProvider {
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

// Console Provider (for Development)
class ConsoleEmailProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {



        return true;
    }
}

// API Provider (Calls Backend)
class ApiEmailProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Email API Error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Email Send Error:', error);
            return false;
        }
    }
}

// Email Service Singleton
class EmailService {
    private provider: EmailProvider;

    constructor() {
        // Use Real API Provider for production/launch
        this.provider = new ApiEmailProvider();
    }

    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        return this.provider.sendEmail(to, subject, html);
    }

    async sendWelcomeEmail(email: string, username: string) {
        const subject = 'Welcome to Gather! 🎉';
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Welcome, ${username}!</h1>
                <p>We're thrilled to have you onboard.</p>
                <p>Get started by setting up your bio page.</p>
            </div>
        `;
        return this.provider.sendEmail(email, subject, html);
    }

    async sendInviteEmail(email: string, teamName: string, inviteUrl: string) {
        const subject = `You've been invited to join ${teamName} on Gather`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Team Invitation</h1>
                <p>You have been invited to join the <strong>${teamName}</strong> team.</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
                <p style="font-size: 12px; color: #666;">This link expires in 7 days.</p>
            </div>
        `;
        return this.provider.sendEmail(email, subject, html);
    }

    async sendGuestLinkNotification(email: string, linkCount: number, clicks: number) {
        const subject = `Your links have ${clicks} clicks! 🚀`;
        const html = `
      <h1>Your links are performing well!</h1>
      <p>You have ${linkCount} active links generating ${clicks} clicks.</p>
      <p><a href="https://gather.link/login">Log in</a> to see detailed analytics.</p>
    `;
        return this.provider.sendEmail(email, subject, html);
    }
}

export const emailService = new EmailService();
