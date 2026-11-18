import React from 'react';
import { Link } from 'react-router-dom';
import LegalShell, { LegalSection, SUPPORT_EMAIL } from '../components/legal/LegalShell';

const SECTIONS: LegalSection[] = [
    {
        heading: 'Agreement to these terms',
        body: <p>By using Gather (the "Service") you agree to these terms. If you don't agree, don't use the Service.</p>,
    },
    {
        heading: 'Your account',
        body: (
            <>
                <p>Give accurate information when you sign up and keep your sign-in details safe. You're responsible for what happens under your account.</p>
                <p>You can shorten a link without an account. Guest links stop working after 7 days unless you sign up and add them to your account.</p>
            </>
        ),
    },
    {
        heading: 'Your links and pages',
        body: (
            <>
                <p>You're responsible for the links you shorten and for what you put on your store and bio pages, including that it's legal and that you have the right to share it.</p>
                <p>Your store page can list products from other shops, with your affiliate tags added where you've set them. Purchases happen on those shops. Gather isn't a party to them.</p>
            </>
        ),
    },
    {
        heading: 'Acceptable use',
        body: (
            <>
                <p>Don't use the Service to:</p>
                <ul>
                    <li>break any law or anyone else's rights;</li>
                    <li>link to malware, phishing or other harmful sites, or hide where a link really goes in order to deceive;</li>
                    <li>send spam;</li>
                    <li>harass, abuse or harm anyone;</li>
                    <li>commit fraud.</li>
                </ul>
                <p>Anyone can report a link. We may disable links, and suspend or close accounts, that break these terms, with or without notice.</p>
            </>
        ),
    },
    {
        heading: 'Paid plans',
        body: <p>Pro and Business are paid plans, billed through Razorpay. What each plan includes is on the <Link to="/pricing">pricing page</Link>.</p>,
    },
    {
        heading: 'Limitation of liability',
        body: <p>To the extent the law allows, Gather and its team, partners and suppliers aren't liable for indirect, incidental, special, consequential or punitive damages, including lost profits, data, use or goodwill, that come from using, or being unable to use, the Service.</p>,
    },
    {
        heading: 'Changes',
        body: <p>We may change these terms. If you keep using the Service after a change takes effect, you accept the new terms.</p>,
    },
    {
        heading: 'Contact',
        body: <p>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>,
    },
];

const Terms: React.FC = () => <LegalShell title="Terms of Service" updated="18 November 2026" sections={SECTIONS} />;

export default Terms;
