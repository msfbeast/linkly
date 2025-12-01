import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Link2, Loader2, Copy, Check, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';
import { toast } from 'sonner';
import QRCodeGenerator from '../components/QRCodeGenerator';
import FeatureShowcaseGrid from '../components/landing/FeatureShowcaseGrid';
import ProductFeatureGrid from '../components/landing/ProductFeatureGrid';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [inputValue, setInputValue] = useState('');
    const [mode, setMode] = useState<'claim' | 'shorten'>('claim');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LinkData | null>(null);
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [placeholder, setPlaceholder] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const placeholders = ["yourname", "artist", "designer", "developer", "startup", "musician", "creator"];

    // Initialize guest session
    useEffect(() => {
        if (!localStorage.getItem('linkly_guest_session')) {
            localStorage.setItem('linkly_guest_session', crypto.randomUUID());
        }
    }, []);

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % placeholders.length;
            const fullText = placeholders[i];

            setPlaceholder(isDeleting
                ? fullText.substring(0, placeholder.length - 1)
                : fullText.substring(0, placeholder.length + 1)
            );

            setTypingSpeed(isDeleting ? 30 : 150);

            if (!isDeleting && placeholder === fullText) {
                setTimeout(() => setIsDeleting(true), 2000); // Pause at end
            } else if (isDeleting && placeholder === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [placeholder, isDeleting, loopNum, typingSpeed, placeholders]);

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            navigate('/dashboard');
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setError(null);

        if (mode === 'shorten') {
            // Handle Link Shortening
            let finalUrl = inputValue;
            if (!inputValue.startsWith('http://') && !inputValue.startsWith('https://')) {
                finalUrl = 'https://' + inputValue;
            }

            setLoading(true);
            try {
                const sessionId = localStorage.getItem('linkly_guest_session')!;
                const newLink = await supabaseAdapter.createGuestLink(finalUrl, sessionId);
                setResult(newLink);
                setInputValue('');
                toast.success('Link shortened!');
            } catch (error: any) {
                setError(error.message || 'Failed to shorten link');
                toast.error(error.message || 'Failed to shorten link');
            } finally {
                setLoading(false);
            }
        } else {
            // Handle Username Claim
            navigate('/register', { state: { username: inputValue } });
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(`${window.location.origin}/${result.shortCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied!');
    };

    const handleClaimLink = () => {
        if (result?.claimToken) {
            navigate(`/register?claim=${result.claimToken}`);
        }
    };

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-yellow-200 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                            <div className="w-6 h-6 bg-yellow-400 rounded-full" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Gather</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-slate-600 hover:text-slate-900 font-medium transition-colors hidden sm:block"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Sign up free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Aurora Background */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Aurora Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-yellow-200/40 via-purple-200/40 to-transparent blur-3xl -z-10 rounded-full opacity-60 animate-pulse-slow" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-stone-200 rounded-full mb-8 shadow-sm">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Smart Link Management</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                            The Only Link <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">You'll Ever Need.</span>
                        </h1>

                        <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Connect your audience to everything you are. One link for your bio, store, and everything in between.
                        </p>

                        {!result ? (
                            /* Input Section */
                            <div className="max-w-xl mx-auto relative group">
                                {/* Mode Toggle */}
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white p-1 rounded-full border border-stone-200 shadow-sm inline-flex">
                                        <button
                                            onClick={() => { setMode('claim'); setInputValue(''); setError(null); }}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'claim'
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'text-stone-500 hover:text-slate-900'
                                                }`}
                                        >
                                            Claim Username
                                        </button>
                                        <button
                                            onClick={() => { setMode('shorten'); setInputValue(''); setError(null); }}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === 'shorten'
                                                ? 'bg-yellow-400 text-slate-900 shadow-md'
                                                : 'text-stone-500 hover:text-slate-900'
                                                }`}
                                        >
                                            Shorten Link
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                                    <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-xl border border-stone-100">
                                        {mode === 'claim' && (
                                            <div className="pl-4 text-lg font-medium text-stone-400 select-none">
                                                gather.link/
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            placeholder={mode === 'shorten' ? "Paste a long link here..." : placeholder}
                                            className="flex-1 px-2 py-3 bg-transparent border-none focus:ring-0 outline-none text-lg placeholder:text-stone-300 text-slate-900 font-bold transition-all"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'shorten'
                                                ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                                }`}
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : mode === 'shorten' ? (
                                                <>
                                                    <span>Shorten</span>
                                                    <Link2 className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Claim Link</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100">
                                        {error}
                                    </div>
                                )}
                                <div className="absolute -bottom-8 left-0 right-0 text-center">
                                    <span className="text-xs font-medium text-stone-400">
                                        {mode === 'shorten' ? "✨ Shorten Mode: Paste a URL to create a guest link." : "Start by claiming your unique username."}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Result Card */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`mx-auto bg-white rounded-2xl p-6 shadow-2xl border border-stone-100 transition-all duration-500 ${showQR ? 'max-w-4xl' : 'max-w-xl'}`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-xl">
                                            <Check className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-slate-900">Link Ready!</h3>
                                            <p className="text-xs text-stone-500 truncate max-w-[200px]">{result.originalUrl}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setResult(null); setInputValue(''); }}
                                        className="text-stone-400 hover:text-slate-900 text-sm font-medium"
                                    >
                                        Create Another
                                    </button>
                                </div>

                                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 mb-6 flex items-center justify-between gap-4">
                                    <span className="font-bold text-xl text-slate-900 truncate">
                                        {window.location.host}/{result.shortCode}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-200 shadow-sm"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-stone-400" />}
                                        </button>
                                        <button
                                            onClick={() => setShowQR(!showQR)}
                                            className={`p-2 rounded-lg transition-colors border shadow-sm ${showQR ? 'bg-white border-stone-200 text-slate-900' : 'border-transparent hover:bg-white hover:border-stone-200 text-stone-400'}`}
                                            title="Show QR Code"
                                        >
                                            <QrCode className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {showQR && (
                                    <div className="mb-6 flex justify-center p-4 bg-white rounded-xl border border-stone-100 shadow-inner animate-in fade-in slide-in-from-top-2">
                                        <QRCodeGenerator
                                            url={`${window.location.origin}/${result.shortCode}`}
                                            title="Guest Link"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={handleClaimLink}
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    Claim & Track Analytics <ArrowRight className="w-5 h-5" />
                                </button>
                                <p className="text-center text-xs text-stone-400 mt-3">
                                    Guest links expire in 7 days. Claim it to keep it forever.
                                </p>
                            </motion.div>
                        )}

                    </motion.div>
                </div>
            </header>

            {/* Feature Showcase Grid */}
            <section id="features">
                <FeatureShowcaseGrid />
            </section>

            {/* Product Feature Grid */}
            <section>
                <ProductFeatureGrid />
            </section>

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer (includes CTA) */}
            <Footer />
        </div>
    );
};

export default LandingPage;
