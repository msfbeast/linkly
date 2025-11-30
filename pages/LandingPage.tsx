import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link as LinkIcon, ArrowRight, CheckCircle2, Zap, Shield } from 'lucide-react';
import GuestLinkCreator from '../components/GuestLinkCreator';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    if (loading) return null; // Or a loading spinner

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-yellow-200">
            {/* Navbar */}
            <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <div className="w-6 h-6 bg-yellow-400 rounded-full" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Gather</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
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
            </nav>

            {/* Hero Section with Guest Link Creator */}
            <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-20"
                >
                    <GuestLinkCreator />
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
                >
                    {[
                        {
                            icon: Zap,
                            title: "Lightning Fast",
                            desc: "Create links in seconds. No complex setup required."
                        },
                        {
                            icon: Shield,
                            title: "Secure & Reliable",
                            desc: "Enterprise-grade security keeps your data safe."
                        },
                        {
                            icon: CheckCircle2,
                            title: "Detailed Analytics",
                            desc: "Track clicks, locations, and devices in real-time."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 text-yellow-600">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-stone-500">{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
};

export default LandingPage;
