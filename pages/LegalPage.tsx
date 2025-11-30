import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LegalPage: React.FC = () => {
    const location = useLocation();
    const path = location.pathname;

    let title = '';
    let content = null;

    if (path === '/privacy') {
        title = 'Privacy Policy';
        content = (
            <div className="space-y-6 text-stone-600">
                <p>Last updated: November 30, 2024</p>
                <p>At Gather, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website gather.link, including any other media form, media channel, mobile website, or mobile application related or connected thereto.</p>
                <h3 className="text-xl font-bold text-slate-900 mt-8">Collection of Data</h3>
                <p>We collect information that you voluntarily provide to us when you register on the Site, express an interest in obtaining information about us or our products and services, when you participate in activities on the Site or otherwise when you contact us.</p>
            </div>
        );
    } else if (path === '/terms') {
        title = 'Terms of Service';
        content = (
            <div className="space-y-6 text-stone-600">
                <p>Last updated: November 30, 2024</p>
                <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the gather.link website (the "Service") operated by Gather ("us", "we", or "our").</p>
                <h3 className="text-xl font-bold text-slate-900 mt-8">Accounts</h3>
                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            </div>
        );
    } else {
        title = 'Cookie Policy';
        content = (
            <div className="space-y-6 text-stone-600">
                <p>Last updated: November 30, 2024</p>
                <p>This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.</p>
                <h3 className="text-xl font-bold text-slate-900 mt-8">Type of Cookies We Use</h3>
                <p>Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on your personal computer or mobile device when you go offline, while Session Cookies are deleted as soon as you close your web browser.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-6">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-slate-900 font-medium mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8">{title}</h1>
                    <div className="prose prose-stone max-w-none">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
