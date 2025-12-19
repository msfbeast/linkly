import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7] py-20 px-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-slate-900 font-medium mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-100">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8">Terms of Service</h1>

                    <div className="prose prose-stone max-w-none space-y-6 text-stone-600">
                        <p className="text-sm text-stone-400">Last updated: December 19, 2025</p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Agreement to Terms</h2>
                            <p>
                                By accessing or using the Gather platform ("Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. User Accounts</h2>
                            <p>
                                When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Content and Commerce</h2>
                            <p>
                                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                            </p>
                            <p className="mt-2">
                                <strong>Commerce:</strong> When you sell products through Gather using our integration with Stripe/Razorpay, you function as the merchant of record. You are responsible for all customer service, refunds, and legal compliance related to your sales. Gather is not a party to the transactions between you and your customers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Acceptable Use</h2>
                            <p>
                                You agree not to use the Service to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Violate any laws or regulations.</li>
                                <li>Infringe upon the rights of others.</li>
                                <li>Distribute malware or malicious code.</li>
                                <li>Harass, abuse, or harm another person.</li>
                                <li>Engage in fraud or deceptive practices.</li>
                            </ul>
                            <p className="mt-4">
                                We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Limitation of Liability</h2>
                            <p>
                                In no event shall Gather, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Changes</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at support@gather.link.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
