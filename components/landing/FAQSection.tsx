import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FREE_LINK_LIMIT } from '../../utils/planLimits';

export const FAQS: { q: string; a: string }[] = [
    {
        q: 'Do I need an account to shorten a link?',
        a: 'No. Paste a link on this page and you get a short one straight away. Guest links work for 7 days; sign up and they move to your account, with their clicks.',
    },
    {
        q: 'What do I get for free?',
        a: `Up to ${FREE_LINK_LIMIT} links, click analytics, a store page for your products, QR codes and your affiliate tags added automatically.`,
    },
    {
        q: 'How do the affiliate tags work?',
        a: 'Save your Amazon Associates tag or Flipkart affiliate ID in Settings. Gather adds it to every Amazon or Flipkart link you shorten, including short amzn.to links, and can update the links you already have.',
    },
    {
        q: 'Can I use my own domain?',
        a: 'Yes. Add a domain like links.yourname.com in Settings, create two DNS records at your domain provider, and your short links work on it.',
    },
    {
        q: 'What counts as a click?',
        a: 'Every visit to a short link. Gather records the country, city, device, browser and where the visitor came from, never their IP address.',
    },
];

const FAQSection: React.FC = () => (
    <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-8">
        <h2 className="mb-6 text-[clamp(28px,4vw,40px)] font-medium tracking-tight">Questions</h2>
        <div className="grid gap-2">
            {FAQS.map(f => (
                <details key={f.q} className="group rounded-2xl bg-[#FBFAF8] px-5 py-4 open:pb-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <ChevronDown className="h-4 w-4 shrink-0 text-[#8C8981] transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-[14px] leading-relaxed text-[#5F5C56]">{f.a}</p>
                </details>
            ))}
        </div>
    </section>
);

export default FAQSection;
