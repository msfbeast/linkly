import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
    {
        name: "Alex Rivera",
        role: "Digital Artist",
        content: "Gather completely changed how I showcase my portfolio. The analytics are insane, and the design is just beautiful.",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces"
    },
    {
        name: "Sarah Chen",
        role: "Content Creator",
        content: "I used to use Linktree, but Gather's custom domains and store integration made the switch a no-brainer. My sales are up 30%.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces"
    },
    {
        name: "Marcus Johnson",
        role: "Musician",
        content: "The best link-in-bio tool hands down. I can sell my merch directly and track where my fans are coming from. 10/10.",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces"
    }
];

const TestimonialsSection = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                        Loved by <span className="text-yellow-500">Creators</span>.
                    </h2>
                    <p className="text-xl text-stone-500 mt-4 max-w-2xl mx-auto">
                        Join thousands of creators who trust Gather to power their online presence.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-stone-50 p-8 rounded-2xl border border-stone-100 relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <Quote className="absolute top-6 right-6 w-8 h-8 text-stone-200 group-hover:text-yellow-400/50 transition-colors" />

                            <div className="flex items-center gap-1 text-yellow-500 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                ))}
                            </div>

                            <p className="text-slate-700 text-lg mb-8 leading-relaxed">"{t.content}"</p>

                            <div className="flex items-center gap-4">
                                <img
                                    src={t.avatar}
                                    alt={t.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white ring-2 ring-stone-100"
                                />
                                <div>
                                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                                    <p className="text-sm text-stone-500">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
