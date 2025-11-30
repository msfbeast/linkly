import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-slate-900 font-medium mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
                        We are Gather.
                    </h1>
                    <p className="text-xl text-stone-500 font-medium leading-relaxed max-w-2xl mx-auto">
                        We're building the future of digital identity. A place where creators, brands, and individuals can bring everything they are into one simple, beautiful link.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-100">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
                        <p className="text-stone-600 text-lg leading-relaxed">
                            To empower everyone to tell their story, sell their work, and grow their audience without the complexity of building a website. We believe in simplicity, beauty, and ownership.
                        </p>
                    </div>
                    <div className="bg-slate-900 rounded-[2.5rem] p-12 shadow-xl text-white">
                        <h2 className="text-3xl font-bold mb-6">Join Us</h2>
                        <p className="text-slate-300 text-lg leading-relaxed mb-8">
                            We're a small, passionate team working on big problems. If you care about design, creator tools, and the open web, we'd love to hear from you.
                        </p>
                        <Link to="/careers" className="inline-block px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-purple-50 transition-colors">
                            View Careers
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
