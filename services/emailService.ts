import { createClient } from '@supabase/supabase-js';

// Email Provider Interface
export interface EmailProvider {
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

// Console Provider (for Development)
class ConsoleEmailProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        console.log('📧 [Email Mock] To:', to);
        console.log('📧 [Email Mock] Subject:', subject);
        console.log('📧 [Email Mock] Body:', html.substring(0, 100) + '...');
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
        // Use API provider in production, or Console in dev if preferred
        // For now, we'll use API provider if not in strictly offline mode
        // But to be safe and allow testing the API flow, we default to ApiEmailProvider
        // unless we want to force console for local dev without backend.
        // Let's use ApiEmailProvider as default for "Resend" replacement.

        this.provider = new ApiEmailProvider();
    }

    async sendWelcomeEmail(email: string, username: string) {
        const subject = 'Welcome to Gather! 🎉';
        const html = `
      <h1>Welcome to Gather, ${username}!</h1>
      <p>We're excited to have you on board.</p>
      <p>Start creating your links and sharing your bio page today.</p>
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
