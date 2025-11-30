import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, ShoppingBag, Palette, Zap, Globe, Shield } from 'lucide-react';

const BentoGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-6">
            {/* Main Feature: Analytics (Large) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200/50 border border-white/50 relative overflow-hidden group hover:shadow-2xl hover:shadow-stone-200/60 transition-all duration-500"
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 rounded-full blur-3xl -mr-24 -mt-24 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-orange-50 rounded-2xl flex items-center justify-center mb-4 text-yellow-600 shadow-inner shadow-white/50">
                                <BarChart2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Deep Analytics</h3>
                            <p className="text-stone-500 max-w-sm text-lg leading-relaxed">Understand your audience with real-time insights. Track clicks, locations, and devices.</p>
                        </div>
                    </div>

                    {/* Mock Graph */}
                    <div className="mt-auto h-64 flex items-end gap-3 px-4 pb-4">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                whileInView={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05, duration: 0.8, type: "spring" }}
                                className="flex-1 rounded-t-xl relative group/bar"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-t ${i % 2 === 0 ? 'from-slate-800 to-slate-600' : 'from-slate-300 to-slate-200'} opacity-80 group-hover/bar:opacity-100 transition-opacity rounded-t-xl`} />
                                <div className="absolute inset-0 bg-yellow-400 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 rounded-t-xl" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Feature: Store (Tall) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2 bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden text-white group hover:-translate-y-1 transition-transform duration-500"
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

                <div className="relative z-10 h-full flex flex-col">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                        <ShoppingBag className="w-7 h-7 text-yellow-400" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 tracking-tight">Sell Anything</h3>
                    <p className="text-slate-400 mb-8 text-lg leading-relaxed">Digital products, merch, or tips. Native checkout.</p>

                    {/* Product Card Mockup */}
                    <div className="mt-auto bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 transform group-hover:scale-105 transition-transform duration-500 shadow-2xl">
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl mb-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/20" />
                        </div>
                        <div className="h-4 w-2/3 bg-white/20 rounded-full mb-3" />
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-1/4 bg-white/10 rounded-full" />
                            <div className="h-8 px-4 bg-yellow-400 rounded-lg flex items-center text-slate-900 font-bold text-sm">
                                $29
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Feature: Customization */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="col-span-1 bg-white rounded-[2rem] p-8 shadow-lg shadow-stone-200/50 border border-white/50 flex flex-col justify-between group hover:border-purple-200 transition-colors relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                        <Palette className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Custom Themes</h3>
                    <p className="text-stone-500">Match your brand perfectly.</p>
                </div>
            </motion.div>

            {/* Feature: AI */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="col-span-1 bg-white rounded-[2rem] p-8 shadow-lg shadow-stone-200/50 border border-white/50 flex flex-col justify-between group hover:border-blue-200 transition-colors relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">AI Powered</h3>
                    <p className="text-stone-500">Content generated in seconds.</p>
                </div>
            </motion.div>

            {/* Feature: Global */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="col-span-1 bg-white rounded-[2rem] p-8 shadow-lg shadow-stone-200/50 border border-white/50 flex flex-col justify-between group hover:border-green-200 transition-colors relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4 text-green-600 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Global CDN</h3>
                    <p className="text-stone-500">Lightning fast everywhere.</p>
                </div>
            </motion.div>

            {/* Feature: Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="col-span-1 bg-white rounded-[2rem] p-8 shadow-lg shadow-stone-200/50 border border-white/50 flex flex-col justify-between group hover:border-red-200 transition-colors relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4 text-red-600 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Enterprise Secure</h3>
                    <p className="text-stone-500">Your data is safe with us.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default BentoGrid;
