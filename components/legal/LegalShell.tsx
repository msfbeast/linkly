import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GatherMark from '../landing/GatherMark';

export const LEGAL_LINKS: [string, string][] = [
    ['Terms', '/terms'], ['Privacy', '/privacy'], ['Cookies', '/cookies'], ['About', '/about'],
];

export const SUPPORT_EMAIL = 'support@gather.link';

export interface LegalSection {
    heading: string;
    body: React.ReactNode;
}

/** Shared frame for the legal and about pages: header, title, sections, footer links. */
const LegalShell: React.FC<{ title: string; updated?: string; intro?: React.ReactNode; sections: LegalSection[]; children?: React.ReactNode }> = ({ title, updated, intro, sections, children }) => {
    useEffect(() => {
        const previous = document.title;
        document.title = `${title} · Gather`;
        return () => { document.title = previous; };
    }, [title]);

    return (
        <div className="min-h-screen bg-[#ECEBE7] text-[#18181A]">
            <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6 sm:px-8">
                <Link to="/" className="flex items-center gap-2 text-[15px] font-medium">
                    <GatherMark size={26} /> Gather
                </Link>
                <Link to="/" className="inline-flex items-center gap-1.5 rounded-full bg-[#FBFAF8] px-3.5 py-1.5 text-[13px] text-[#5F5C56] hover:text-[#18181A]">
                    <ArrowLeft className="h-3.5 w-3.5" /> Home
                </Link>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
                <h1 className="text-[clamp(32px,5vw,48px)] font-medium leading-tight tracking-tight">{title}</h1>
                {updated && <p className="mt-2 font-mono text-[12px] text-[#8C8981]">Last updated {updated}</p>}
                {intro && <div className="mt-5 text-[16px] leading-relaxed text-[#3D3B37]">{intro}</div>}

                {sections.length > 0 && (
                    <div className="mt-8 rounded-3xl bg-[#FBFAF8] p-6 sm:p-10">
                        {sections.map((s, i) => (
                            <section key={s.heading} className={i > 0 ? 'mt-8 border-t border-[#ECEAE6] pt-8' : ''}>
                                <h2 className="mb-3 text-[18px] font-medium tracking-tight">
                                    <span className="mr-2 font-mono text-[13px] text-[#A19E97]">{String(i + 1).padStart(2, '0')}</span>{s.heading}
                                </h2>
                                <div className="legal-body grid gap-3 text-[15px] leading-relaxed text-[#3D3B37] [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-[#18181A] [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-5">
                                    {s.body}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
                {children}
            </main>

            <footer className="mx-auto max-w-3xl px-4 pb-10 sm:px-8">
                <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#DAD7D0] pt-6 text-[13px] text-[#8C8981]">
                    {LEGAL_LINKS.map(([name, to]) => <Link key={to} to={to} className="hover:text-[#18181A]">{name}</Link>)}
                    <Link to="/pricing" className="hover:text-[#18181A]">Pricing</Link>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-[#18181A]">{SUPPORT_EMAIL}</a>
                </nav>
            </footer>
        </div>
    );
};

export default LegalShell;
