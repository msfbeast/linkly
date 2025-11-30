import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Facebook, Globe } from 'lucide-react';

const Footer: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    const handleClaimSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            navigate('/register', { state: { username } });
        }
    };

    return (
        <footer className="bg-white">
            {/* Jumpstart CTA Section - Glassmorphic Card */}
            <div className="py-24 px-6 bg-white">
                <div className="max-w-5xl mx-auto relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-[2.5rem] blur opacity-30" />
                    <div className="relative bg-white rounded-[2rem] p-12 md:p-20 text-center overflow-hidden border border-stone-100 shadow-2xl">

                        {/* Background Blobs */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-yellow-200/30 rounded-full blur-[100px]" />
                            <div className="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[100px]" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
                                Ready to tell your story?
                            </h2>
                            <p className="text-xl text-stone-500 mb-12 max-w-2xl mx-auto">
                                Join the community of creators shaping the future of the internet.
                            </p>

                            <form onSubmit={handleClaimSubmit} className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                                <div className="relative w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">
                                        gather.link/
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="yourname"
                                        className="w-full h-14 pl-24 pr-4 rounded-xl border-2 border-stone-100 focus:border-purple-500 focus:ring-0 text-slate-900 font-medium bg-stone-50 transition-all"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full md:w-auto h-14 px-8 bg-slate-900 hover:bg-purple-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 whitespace-nowrap"
                                >
                                    Get Started
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Links Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-20">
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-lg mb-6">Company</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/about" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">About</Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Blog</Link>
                            </li>
                            <li>
                                <Link to="/careers" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Careers</Link>
                            </li>
                            <li>
                                <a href="mailto:hello@gather.link" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Contact</a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-lg mb-6">Product</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/pricing" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Pricing</Link>
                            </li>
                            <li>
                                <Link to="/#features" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Features</Link>
                            </li>
                            <li>
                                <Link to="/help" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Help Center</Link>
                            </li>
                            <li>
                                <Link to="/community" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Community</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-lg mb-6">Legal</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/privacy" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Terms of Service</Link>
                            </li>
                            <li>
                                <Link to="/cookies" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Cookie Policy</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-stone-100 gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p className="text-stone-500 text-sm text-center md:text-left">
                            © 2024 Gather. All rights reserved.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white hover:bg-[#502274] transition-colors">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
