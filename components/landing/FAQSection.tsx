import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "What makes Gather different?",
            answer: "Gather focuses on premium design and simplicity. We believe your link in bio should look as good as your content, with zero design skills required."
        },
        {
            question: "Can I sell products directly?",
            answer: "Yes! Gather has built-in commerce tools. You can sell digital downloads, merchandise, or collect tips without sending your followers to another site."
        },
        {
            question: "Is there a free plan?",
            answer: "Absolutely. You can create a beautiful, functional Gather page for free. We also offer a Pro plan for advanced analytics and custom domains."
        },
        {
            question: "Can I use my own domain?",
            answer: "Yes, on our Pro plan you can connect your own custom domain (e.g., yourname.com) to your Gather page for a fully branded experience."
        },
        {
            question: "How do I get started?",
            answer: "It takes less than a minute. Just claim your username above, sign up, and start adding your links. It's that easy."
        }
    ];

    return (
        <section className="bg-white py-24 px-6">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 text-center mb-16 tracking-tight">
                    Questions? Answered.
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all hover:shadow-md hover:border-purple-200"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-8 py-6 flex items-center justify-between text-left"
                            >
                                <span className="text-lg font-bold text-slate-900 pr-8">
                                    {faq.question}
                                </span>
                                <div className={`transition-transform duration-300 text-stone-400 ${openIndex === index ? 'rotate-180 text-purple-600' : ''}`}>
                                    <ChevronDown className="w-6 h-6" />
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-8 pb-8 text-stone-600 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
