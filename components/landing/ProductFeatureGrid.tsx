import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ShoppingBag, Palette, Zap, Globe, Shield } from 'lucide-react';

const ProductFeatureGrid: React.FC = () => {
    return (
        <div className="w-full py-32 bg-[#FDFBF7] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 space-y-32">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight">
                        Everything you are.
                    </h2>
                    <p className="text-xl text-stone-500 font-medium leading-relaxed">
                        One simple link. Infinite possibilities. We've built the tools you need to grow, sell, and share.
                    </p>
                </div>

                {/* Feature 1: Deep Analytics (Text Left, Visual Right) */}
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            Deep Analytics that <br />
                            <span className="text-yellow-500">drive growth.</span>
                        </h3>
                        <p className="text-lg text-stone-500 leading-relaxed max-w-md">
                            Stop guessing. Understand your audience with real-time insights. Track clicks, locations, and devices to optimize your content strategy.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 w-full"
                    >
                        <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 aspect-square md:aspect-[4/3] flex items-end overflow-hidden">
                            {/* Chart Visual */}
                            <div className="w-full flex items-end gap-4 h-3/4 px-4 pb-4">
                                {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`flex-1 rounded-t-lg ${i % 2 === 0 ? 'bg-gradient-to-t from-yellow-400 to-yellow-300' : 'bg-stone-100'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feature 2: Monetization (Visual Left, Text Right) */}
                <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 w-full"
                    >
                        <div className="relative bg-white rounded-[2.5rem] p-12 shadow-xl border border-stone-100 aspect-square md:aspect-[4/3] flex items-center justify-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
                            <div className="relative z-10 w-64 bg-white rounded-2xl shadow-2xl p-6 border border-stone-100 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                                <div className="w-full aspect-square bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl mb-4 flex items-center justify-center">
                                    <ShoppingBag className="w-12 h-12 text-white/50" />
                                </div>
                                <div className="h-4 w-2/3 bg-stone-100 rounded-full mb-2" />
                                <div className="flex justify-between items-center mt-4">
                                    <div className="h-8 w-20 bg-stone-100 rounded-lg" />
                                    <div className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm">$29.00</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <div className="flex-1 space-y-8 md:pl-12">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            Build your perfect <br />
                            <span className="text-purple-600">Storefront Showcase.</span>
                        </h3>
                        <p className="text-lg text-stone-500 leading-relaxed max-w-md">
                            Turn your bio link into a beautiful product showcase. Display your digital products, merch, and more with a stunning native design that links directly to your checkout.
                        </p>
                    </div>
                </div>

                {/* Feature 3: Customization (Text Left, Visual Right) */}
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                    <div className="flex-1 space-y-8">
                        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center">
                            <Palette className="w-8 h-8 text-pink-600" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            Designed to be <br />
                            <span className="text-pink-500">uniquely yours.</span>
                        </h3>
                        <p className="text-lg text-stone-500 leading-relaxed max-w-md">
                            Match your brand perfectly with custom themes, fonts, and layouts. Or let our AI generate a stunning design for you in seconds.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 w-full"
                    >
                        <div className="relative bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 aspect-square md:aspect-[4/3] overflow-hidden grid grid-cols-2 gap-4">
                            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100" />
                            <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100" />
                            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100" />
                            <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100" />
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default ProductFeatureGrid;
