import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Initialize Resend with server-side API key
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Gather <notifications@gather.link>', // Ensure this domain is verified in Resend
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ data });
    } catch (error: any) {
        console.error('Email Send Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
