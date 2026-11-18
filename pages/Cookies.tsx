import React from 'react';
import LegalShell, { LegalSection, SUPPORT_EMAIL } from '../components/legal/LegalShell';

const SECTIONS: LegalSection[] = [
    {
        heading: 'What we store in your browser',
        body: (
            <>
                <p>Gather doesn't use advertising or tracking cookies. To work, it keeps a few things in your browser's local storage:</p>
                <ul>
                    <li><strong>Your sign-in session</strong>, so you stay signed in.</li>
                    <li><strong>A guest ID</strong>, if you shorten a link without an account, so you can add it to an account later.</li>
                    <li><strong>Small preferences</strong>, such as whether you've dismissed this notice or the install prompt.</li>
                </ul>
            </>
        ),
    },
    {
        heading: 'Analytics',
        body: <p>We count page views and measure page speed with Vercel Analytics and Speed Insights. Neither uses cookies.</p>,
    },
    {
        heading: 'Payments',
        body: <p>If you buy a paid plan, Razorpay's checkout may set its own cookies, for security and fraud prevention. Their use is covered by Razorpay's policies.</p>,
    },
    {
        heading: 'Clearing it',
        body: <p>Clearing your browser's site data for Gather removes everything above. You'll be signed out, and any guest link you haven't added to an account can no longer be claimed from that browser.</p>,
    },
    {
        heading: 'Contact',
        body: <p>Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>,
    },
];

const Cookies: React.FC = () => <LegalShell title="Cookie Policy" updated="18 November 2026" sections={SECTIONS} />;

export default Cookies;
