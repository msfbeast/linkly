import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Copy, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { setPendingClaim } from '../utils/pendingClaim';
import { FREE_LINK_LIMIT } from '../utils/planLimits';
import GatherMark from '../components/landing/GatherMark';
import LandingFeatures from '../components/landing/LandingFeatures';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';

type Mode = 'shorten' | 'claim';

/** The address a store page gets: this site's host, then /@handle. */
export const storeAddressPrefix = (host = typeof window !== 'undefined' ? window.location.host : 'links.trak.in') => `${host}/@`;

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [mode, setMode] = useState<Mode>('shorten');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LinkData | null>(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (!localStorage.getItem('gather_guest_session')) localStorage.setItem('gather_guest_session', crypto.randomUUID());
        } catch { /* private mode: a session is made per request below */ }
    }, []);

    useEffect(() => {
        if (!authLoading && user) navigate('/dashboard');
    }, [user, authLoading, navigate]);

    const switchMode = (m: Mode) => { setMode(m); setInputValue(''); setError(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = inputValue.trim();
        if (!value) return;
        setError(null);

        if (mode === 'claim') {
            navigate('/register', { state: { username: value.replace(/^@/, '') } });
            return;
        }

        const finalUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        setLoading(true);
        try {
            let sessionId: string;
            try { sessionId = localStorage.getItem('gather_guest_session') || crypto.randomUUID(); } catch { sessionId = crypto.randomUUID(); }
            const newLink = await supabaseAdapter.createGuestLink(finalUrl, sessionId);
            // Claimed automatically once this visitor signs in (PendingClaimHandler).
            if (newLink.claimToken) setPendingClaim(newLink.claimToken);
            setResult(newLink);
            setInputValue('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not shorten that link');
        } finally {
            setLoading(false);
        }
    };

    const shortUrl = result ? `${window.location.origin}/${result.shortCode}` : '';

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied');
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#ECEBE7] text-[#18181A] selection:bg-[#FFD3BE]">
            {/* Top bar */}
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
                <Link to="/" className="flex items-center gap-2" aria-label="Gather home">
                    <GatherMark />
                    <span className="text-[17px] font-medium tracking-tight">Gather</span>
                </Link>
                <div className="flex items-center gap-1.5">
                    <Link to="/pricing" className="hidden rounded-full px-4 py-2 text-[13px] text-[#5F5C56] hover:text-[#18181A] sm:block">Pricing</Link>
                    <Link to="/login" className="rounded-full px-4 py-2 text-[13px] text-[#5F5C56] hover:text-[#18181A]">Log in</Link>
                    <Link to="/register" className="rounded-full bg-[#18181A] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">Sign up free</Link>
                </div>
            </nav>

            {/* Hero */}
            <header className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
                <div className="max-w-3xl">
                    <p className="mb-5 flex items-center gap-2 text-[13px] text-[#8C8981]">
                        <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]" /> Short links · store page · analytics
                    </p>
                    <h1 className="text-[clamp(40px,7vw,80px)] font-medium leading-[0.98] tracking-[-0.035em]">
                        Short links that <span className="text-[#FF5A14]">count</span> every click.
                    </h1>
                    <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#5F5C56]">
                        Shorten a link, put your products on one page, and see where every click comes from. Amazon and Flipkart tags are added for you.
                    </p>
                </div>

                <div className="mt-10 max-w-2xl">
                    {!result ? (
                        <div className="rounded-3xl bg-[#FBFAF8] p-3 sm:p-4">
                            <div role="group" aria-label="What to do" className="mb-3 flex gap-1 rounded-full bg-[#F0EEEA] p-1 sm:w-fit">
                                {([['shorten', 'Shorten a link'], ['claim', 'Claim your page']] as const).map(([m, label]) => (
                                    <button key={m} type="button" onClick={() => switchMode(m)} aria-pressed={mode === m}
                                        className={`flex-1 rounded-full px-4 py-2 text-[13px] transition-colors sm:flex-none ${mode === m ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                                <label className="flex min-w-0 flex-1 items-center rounded-2xl bg-[#F0EEEA] px-4 focus-within:ring-2 focus-within:ring-[#FF5A14]/30">
                                    <span className="sr-only">{mode === 'shorten' ? 'Long link' : 'Username'}</span>
                                    {mode === 'claim' && <span className="shrink-0 select-none font-mono text-[14px] text-[#8C8981]">{storeAddressPrefix()}</span>}
                                    <input
                                        type="text"
                                        inputMode={mode === 'shorten' ? 'url' : 'text'}
                                        autoCapitalize="off"
                                        autoCorrect="off"
                                        placeholder={mode === 'shorten' ? 'Paste a long link' : 'yourname'}
                                        className="min-w-0 flex-1 bg-transparent py-4 font-mono text-[15px] outline-none placeholder:text-[#A19E97]"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                </label>
                                <button type="submit" disabled={loading || !inputValue.trim()}
                                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF5A14] px-6 py-4 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'shorten' ? 'Shorten' : <>Claim <ArrowRight className="h-4 w-4" /></>}
                                </button>
                            </form>
                            {error && <p role="alert" className="mt-3 rounded-xl bg-[#FDECEA] px-3 py-2 text-[13px] text-[#B42318]">{error}</p>}
                            <p className="mt-3 px-1 text-[12px] text-[#A19E97]">
                                {mode === 'shorten' ? 'No account needed. Guest links work for 7 days.' : 'Your store page, with your products and links, lives at this address.'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-[#18181A] p-5 text-[#F2F1EE] sm:p-6">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-[13px] text-[#A19E97]">
                                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]" /> Link ready
                                </span>
                                <button onClick={() => { setResult(null); setShowQR(false); }} className="text-[13px] text-[#8E8B84] hover:text-white">Shorten another</button>
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl bg-[#232326] py-2 pl-4 pr-2">
                                <span className="min-w-0 flex-1 truncate font-mono text-[16px] sm:text-[18px]">{window.location.host}/{result.shortCode}</span>
                                <button onClick={handleCopy} aria-label="Copy link"
                                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] ${copied ? 'bg-[#FF5A14] text-white' : 'bg-[#2A2A2D] hover:bg-[#333336]'}`}>
                                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={() => setShowQR(v => !v)} aria-label="QR code" aria-pressed={showQR}
                                    className={`rounded-full p-2 ${showQR ? 'bg-[#F2F1EE] text-[#18181A]' : 'bg-[#2A2A2D] hover:bg-[#333336]'}`}>
                                    <QrCode className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mt-2 truncate px-1 font-mono text-[11px] text-[#77746D]">→ {result.originalUrl}</p>
                            {showQR && (
                                <div className="mt-4 flex justify-center rounded-2xl bg-white p-4 text-[#18181A]">
                                    <QRCodeGenerator url={shortUrl} title="Guest link" />
                                </div>
                            )}
                            <p className="mt-5 text-[13px] text-[#FF9B6A]">Works for 7 days. Sign up free to keep it and see its clicks.</p>
                            <button onClick={() => result.claimToken && navigate(`/claim/${result.claimToken}`)}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5A14] py-3.5 text-[14px] font-medium text-white hover:opacity-90">
                                Keep this link <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <section id="features">
                <LandingFeatures freeLinkLimit={FREE_LINK_LIMIT} />
            </section>

            <FAQSection />
            <Footer />
        </div>
    );
};

export default LandingPage;
