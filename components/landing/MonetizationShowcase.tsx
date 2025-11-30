import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';

const MonetizationShowcase: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const rotate = useTransform(scrollYProgress, [0, 1], [5, -5]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

    return (
        <div ref={containerRef} className="w-full py-32 relative overflow-hidden bg-slate-900 text-white">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Monetization</span>
                        </div>

                        <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                            Turn Clicks into <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">Cash.</span>
                        </h2>

                        <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-lg">
                            Sell products, accept tips, and offer subscriptions directly from your link. No coding required.
                        </p>

                        <div className="flex flex-col gap-6">
                            {[
                                { icon: ShoppingBag, title: "Sell Digital Products", desc: "E-books, presets, and courses." },
                                { icon: CreditCard, title: "Accept Payments", desc: "Tips, donations, and commissions." },
                                { icon: TrendingUp, title: "Track Revenue", desc: "Real-time analytics and insights." }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex items-start gap-4 group"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                        <feature.icon className="w-6 h-6 text-white group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                                        <p className="text-slate-400">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Visual - 3D Floating Interface */}
                    <div className="relative h-[600px] flex items-center justify-center perspective-1000">
                        <motion.div
                            style={{ y, rotate, scale }}
                            className="relative w-[380px] bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl shadow-emerald-900/50"
                        >
                            {/* Floating "New Sale" Notification */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -right-12 top-20 bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
                            >
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">New Sale</div>
                                    <div className="text-lg font-bold">+$49.00</div>
                                </div>
                            </motion.div>

                            {/* Floating "Subscriber" Notification */}
                            <motion.div
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -left-8 bottom-32 bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">New Sub</div>
                                    <div className="text-lg font-bold">+$12/mo</div>
                                </div>
                            </motion.div>

                            {/* Mock Phone Interface */}
                            <div className="bg-slate-900 rounded-[2rem] overflow-hidden h-full border border-white/5 relative">
                                {/* Header */}
                                <div className="h-32 bg-gradient-to-br from-emerald-600 to-teal-800 p-6 flex flex-col justify-end">
                                    <div className="w-16 h-16 bg-white rounded-full border-4 border-slate-900 shadow-lg mb-[-32px] relative z-10">
                                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" className="w-full h-full rounded-full object-cover" alt="Profile" />
                                    </div>
                                </div>

                                <div className="pt-12 px-6 pb-6 space-y-4">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-white">Elena V.</h3>
                                        <p className="text-slate-400 text-sm">Digital Artist & Creator</p>
                                    </div>

                                    {/* Product Card */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Product" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white mb-1 group-hover/item:text-emerald-400 transition-colors">Masterclass: 3D Art</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-400 font-bold">$49.00</span>
                                                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                                                    <ArrowUpRight className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Card 2 */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:bg-white/10 transition-colors cursor-pointer group/item">
                                        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="Product" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white mb-1 group-hover/item:text-emerald-400 transition-colors">Texture Pack Vol. 1</div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-400 font-bold">$15.00</span>
                                                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                                                    <ArrowUpRight className="w-3 h-3 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-center mt-4 shadow-lg shadow-white/10">
                                        Subscribe for $5/mo
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <style>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .animate-pulse-slow {
                    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};

export default MonetizationShowcase;
