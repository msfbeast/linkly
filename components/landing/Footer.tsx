import React from 'react';
import { Link } from 'react-router-dom';
import GatherMark from './GatherMark';

const LINKS: [string, string][] = [
    ['Pricing', '/pricing'], ['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'],
];

const Footer: React.FC = () => (
    <footer className="mx-auto max-w-6xl px-4 pb-10 sm:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#18181A] p-7 text-[#F2F1EE] sm:flex-row sm:items-center sm:p-10">
            <div>
                <h2 className="text-[clamp(26px,4vw,40px)] font-medium leading-tight tracking-tight">Start with your first link.</h2>
                <p className="mt-2 text-[14px] text-[#A19E97]">Free, no card needed.</p>
            </div>
            <Link to="/register" className="rounded-full bg-[#FF5A14] px-6 py-3 text-[14px] font-medium text-white hover:opacity-90">Sign up free</Link>
        </div>
        <div className="flex flex-col gap-5 border-t border-[#DAD7D0] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[13px] text-[#8C8981]">
                <GatherMark size={22} /> © {new Date().getFullYear()} Gather
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#8C8981]">
                {LINKS.map(([name, to]) => <Link key={to} to={to} className="hover:text-[#18181A]">{name}</Link>)}
                <a href="mailto:hello@gather.link" className="hover:text-[#18181A]">Contact</a>
            </nav>
        </div>
    </footer>
);

export default Footer;
