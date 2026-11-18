import React from 'react';
import { Link } from 'react-router-dom';
import LegalShell from '../components/legal/LegalShell';

const THINGS: [string, string][] = [
    ['Short links', 'Shorten any link, with your Amazon and Flipkart affiliate tags added for you.'],
    ['Click analytics', 'See where clicks come from, on which devices, and when, for every link.'],
    ['Store and bio pages', 'One page for the products you recommend and the links you want people to find.'],
];

const AboutPage: React.FC = () => (
    <LegalShell
        title="About Gather"
        intro={<p>Gather is a link shortener and store page for creators who share products. Make a short link, see who clicks it, and keep everything you recommend on one page.</p>}
        sections={[]}
    >
        <div className="mt-8 grid gap-3.5 sm:grid-cols-3">
            {THINGS.map(([title, text]) => (
                <div key={title} className="rounded-3xl bg-[#FBFAF8] p-6">
                    <h2 className="text-[16px] font-medium">{title}</h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#5F5C56]">{text}</p>
                </div>
            ))}
        </div>
        <div className="mt-3.5 flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#18181A] p-7 text-[#F2F1EE] sm:flex-row sm:items-center sm:p-8">
            <div>
                <h2 className="text-[22px] font-medium tracking-tight">Say hello</h2>
                <p className="mt-1 text-[14px] text-[#A19E97]">Questions, ideas or partnerships: <a href="mailto:hello@gather.link" className="text-white underline underline-offset-2">hello@gather.link</a></p>
            </div>
            <Link to="/register" className="rounded-full bg-[#FF5A14] px-5 py-2.5 text-[14px] font-medium text-white hover:opacity-90">Sign up free</Link>
        </div>
    </LegalShell>
);

export default AboutPage;
