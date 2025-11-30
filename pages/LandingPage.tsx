import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BentoGrid from '../components/landing/BentoGrid';
import FeatureShowcaseGrid from '../components/landing/FeatureShowcaseGrid';
import ProductFeatureGrid from '../components/landing/ProductFeatureGrid';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [username, setUsername] = useState('');
    const [placeholder, setPlaceholder] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const placeholders = ["yourname", "artist", "designer", "developer", "startup", "musician", "creator"];

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
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleClaimSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            navigate('/register', { state: { username } });
        }
    };

    if (loading) return null;

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

                        {/* Claim Username Input */}
                        <form onSubmit={handleClaimSubmit} className="max-w-xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-xl border border-stone-100">
                                <div className="pl-4 text-lg font-medium text-stone-400 select-none">
                                    gather.link/
                                </div>
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    className="flex-1 px-2 py-3 bg-transparent border-none focus:ring-0 text-lg placeholder:text-stone-300 text-slate-900 font-bold transition-all"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span>Claim your link</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
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
