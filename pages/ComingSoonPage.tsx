import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

const ComingSoonPage: React.FC = () => {
    const location = useLocation();
    const pageName = location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2);

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-yellow-200/40 via-purple-200/40 to-transparent blur-3xl -z-10 rounded-full opacity-60" />

            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/10 mx-auto mb-8 border border-stone-100">
                    <Construction className="w-10 h-10 text-purple-500" />
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                    {pageName} is <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Coming Soon.</span>
                </h1>

                <p className="text-lg text-stone-500 mb-12 leading-relaxed">
                    We're working hard to bring you this page. Stay tuned for updates!
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default ComingSoonPage;
