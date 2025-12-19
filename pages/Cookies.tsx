import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cookies: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-slate-900 font-medium mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Cookie Policy</h1>

                    <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
                        <p className="text-sm text-stone-400">Last updated: December 19, 2025</p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. What are cookies?</h2>
                            <p>
                                Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. How Gather uses cookies</h2>
                            <p>
                                When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>To enable certain functions of the Service.</li>
                                <li>To provide analytics.</li>
                                <li>To store your preferences.</li>
                                <li>To enable advertisements delivery, including behavioral advertising.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Type of Cookies</h2>
                            <p>
                                We use both session and persistent cookies on the Service and we use different types of cookies to run the Service:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Essential cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.</li>
                                <li><strong>Analytics cookies:</strong> We may use analytics cookies to track information how the Service is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the Service to see how our users react to them.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cookies;
