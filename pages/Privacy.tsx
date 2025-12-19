import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-slate-900 font-medium mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Privacy Policy</h1>

                    <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
                        <p className="text-sm text-stone-400">Last updated: December 19, 2025</p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Introduction</h2>
                            <p>
                                Gather ("we", "our", or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit the website gather.link (our "Website") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Information We Collect</h2>
                            <p>
                                We collect several types of information from and about users of our Website, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Personal Information:</strong> Name, email address, profile image, and social media handles provided during registration.</li>
                                <li><strong>Usage Data:</strong> Information about how you access and use the Service, including your IP address, browser type, and device information.</li>
                                <li><strong>Transaction Data:</strong> If you use our commerce features, we collect information related to your orders and sales, though payment processing is handled by thirdparty providers.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. How We Use Your Information</h2>
                            <p>
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Provide, operate, and maintain our Service.</li>
                                <li>Improve, personalize, and expand our Service.</li>
                                <li>Process your transactions and prevent fraud.</li>
                                <li>Send you emails, including receipts, technical notices, and support messages.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Third-Party Service Providers</h2>
                            <p>
                                We may share your data with trusted third-party service providers to help us operate our business:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Supabase:</strong> For database hosting and authentication.</li>
                                <li><strong>Razorpay:</strong> For payment processing (we do not store your full card details).</li>
                                <li><strong>Resend:</strong> For sending transactional emails.</li>
                                <li><strong>Vercel:</strong> For hosting and analytics.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Data Retention</h2>
                            <p>
                                We will retain your Personal Information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Your Rights</h2>
                            <p>
                                You have the right to access, update, or delete the information we have on you. Whenever made possible, you can access, update or request deletion of your Personal Information directly within your account settings section. If you are unable to perform these actions yourself, please contact us to assist you.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at privacy@gather.link.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
