import React from 'react';
import { Link } from 'react-router-dom';
import LegalShell, { LegalSection, SUPPORT_EMAIL } from '../components/legal/LegalShell';

const SECTIONS: LegalSection[] = [
    {
        heading: 'Who this covers',
        body: <p>This policy covers people with a Gather account, people who shorten a link without one, and people who click a Gather short link or visit a store or bio page.</p>,
    },
    {
        heading: 'If you have an account',
        body: (
            <ul>
                <li><strong>Account details:</strong> your email address, name, username and profile picture. If you sign in with Google or GitHub, we get your email address and name from them.</li>
                <li><strong>What you create:</strong> your links, tags, store and bio pages, and your settings.</li>
                <li><strong>Payments:</strong> if you buy a paid plan, Razorpay processes the payment. We keep your plan and Razorpay's customer and subscription references, never your card details.</li>
            </ul>
        ),
    },
    {
        heading: 'If you click a short link or visit a page',
        body: (
            <>
                <p>When someone clicks a Gather short link, we record the click so the link's owner can see how it's doing:</p>
                <ul>
                    <li>the time, and the page that sent you (the referrer);</li>
                    <li>your approximate location (country, region, city and rough coordinates), worked out from your IP address;</li>
                    <li>your device type, operating system, browser, screen size, time zone and language.</li>
                </ul>
                <p>We don't store your IP address. We keep a keyed hash of it, and a keyed visitor identifier that changes every day, so clicks can be counted once per visitor.</p>
                <p>The link's owner can see this for each click on their links. They never see your IP address.</p>
                <p>When you visit a store or bio page, we only add one to its view count. Your IP address is hashed so each visitor is counted once.</p>
            </>
        ),
    },
    {
        heading: 'If you shorten a link without an account',
        body: <p>We keep the link and a random ID stored in your browser, so you can add the link to an account if you sign up. Guest links and their clicks are deleted after 7 days unless you do.</p>,
    },
    {
        heading: 'Error reports',
        body: <p>When something breaks, your browser sends us the error, the page it happened on and your browser's user agent, so we can fix it. Error reports are deleted after 30 days.</p>,
    },
    {
        heading: 'How we use it',
        body: (
            <ul>
                <li>To run the Service: redirecting links, showing analytics, and showing your pages.</li>
                <li>To keep it safe: finding harmful links and preventing abuse.</li>
                <li>To send emails about your account, such as confirming your email address or resetting your password.</li>
            </ul>
        ),
    },
    {
        heading: 'Who we share it with',
        body: (
            <>
                <p>We don't sell personal data. These providers process it for us:</p>
                <ul>
                    <li><strong>Supabase:</strong> database and sign-in.</li>
                    <li><strong>Vercel:</strong> hosting, plus page-view and performance analytics, which don't use cookies.</li>
                    <li><strong>Razorpay:</strong> payments.</li>
                    <li><strong>Resend:</strong> email.</li>
                </ul>
            </>
        ),
    },
    {
        heading: 'Your rights',
        body: <p>You can see and change your details in <Link to="/settings">Settings</Link>. To get a copy of your data, or to delete your account and everything in it, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on your account.</p>,
    },
    {
        heading: 'Retention',
        body: <p>We keep your account data while your account is open, and delete it when you ask us to close the account, except where the law requires us to keep it. Guest links last 7 days and error reports 30 days, as above.</p>,
    },
    {
        heading: 'Contact',
        body: <p>Questions about privacy: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>,
    },
];

const Privacy: React.FC = () => <LegalShell title="Privacy Policy" updated="18 November 2026" sections={SECTIONS} />;

export default Privacy;
