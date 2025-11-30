import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Music, Video, BarChart3, Globe, MessageCircle, Heart, Share2 } from 'lucide-react';

const FeatureShowcaseGrid: React.FC = () => {
    return (
        <div className="w-full py-24 bg-[#F3F3F1]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Card 1: Content (Pink) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#E9C0E9] rounded-[2.5rem] p-8 md:p-12 min-h-[500px] flex flex-col justify-between overflow-hidden relative group"
                    >
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-extrabold text-[#502274] mb-6 leading-tight tracking-tight">
                                Share every type of content in limitless ways
                            </h3>
                        </div>

                        {/* Visuals */}
                        <div className="relative h-64 w-full mt-8">
                            {/* Music Player */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="absolute left-0 bottom-10 w-64 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl transform -rotate-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-400 rounded-lg flex items-center justify-center">
                                        <Music className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="h-2 w-24 bg-rose-200 rounded-full mb-2" />
                                        <div className="h-2 w-16 bg-rose-100 rounded-full" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Video Player */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute right-0 bottom-20 w-64 bg-slate-900 rounded-2xl p-4 shadow-xl transform rotate-3"
                            >
                                <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                                    <Video className="text-white/50 w-8 h-8" />
                                </div>
                                <div className="h-2 w-32 bg-slate-700 rounded-full" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card 2: Commerce (Lime) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#D2E823] rounded-[2.5rem] p-8 md:p-12 min-h-[500px] flex flex-col justify-end overflow-hidden relative group"
                    >
                        {/* Visuals - Floating Products */}
                        <div className="absolute inset-0">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-12 right-12 w-32 h-40 bg-[#9D34DA] rounded-2xl shadow-xl transform rotate-12 flex flex-col items-center justify-center text-white"
                            >
                                <ShoppingBag className="w-12 h-12 mb-2" />
                                <span className="font-bold">$40</span>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute top-32 left-12 w-32 h-40 bg-[#C45E2E] rounded-2xl shadow-xl transform -rotate-6 flex flex-col items-center justify-center text-white"
                            >
                                <ShoppingBag className="w-12 h-12 mb-2" />
                                <span className="font-bold">$20</span>
                            </motion.div>
                        </div>

                        <div className="relative z-10 mt-64">
                            <h3 className="text-4xl md:text-5xl font-extrabold text-[#254f1a] mb-6 leading-tight tracking-tight">
                                Showcase products and drive sales effortlessly
                            </h3>
                        </div>
                    </motion.div>

                    {/* Card 3: Analytics (Beige) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#E0E2D9] rounded-[2.5rem] p-8 md:p-12 min-h-[400px] flex flex-row items-center justify-between overflow-hidden relative group md:col-span-2 lg:col-span-1"
                    >
                        <div className="flex-1 pr-8">
                            <h3 className="text-4xl md:text-5xl font-extrabold text-[#1a1a1a] mb-6 leading-tight tracking-tight">
                                Analyze your audience and keep them engaged
                            </h3>
                            <p className="text-lg text-stone-600">
                                Track engagement, monitor revenue, and learn what converts.
                            </p>
                        </div>

                        {/* Visuals - Charts */}
                        <div className="w-1/2 relative h-full min-h-[200px]">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                className="absolute top-0 right-0 bg-[#5B6148] text-[#D2E823] p-6 rounded-3xl w-48 shadow-lg"
                            >
                                <BarChart3 className="w-8 h-8 mb-2" />
                                <div className="text-3xl font-bold">43,500</div>
                                <div className="text-sm font-medium opacity-80">Clicks</div>
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute bottom-0 left-0 bg-[#D580FF] text-white p-6 rounded-3xl w-48 shadow-lg z-10"
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center mb-2">
                                    <span className="font-bold">$</span>
                                </div>
                                <div className="text-3xl font-bold">$2,362</div>
                                <div className="text-sm font-medium opacity-80">Sales</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Card 4: Engagement (Blue) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#133B99] rounded-[2.5rem] p-8 md:p-12 min-h-[500px] flex flex-col overflow-hidden relative group md:col-span-2 lg:col-span-1"
                    >
                        <div className="relative z-10 w-full md:w-2/3">
                            <h3 className="text-4xl md:text-5xl font-extrabold text-[#D2E823] mb-6 leading-tight tracking-tight">
                                Grow, own and engage your audience across all your channels
                            </h3>
                        </div>

                        {/* Visuals - Phone Mockup */}
                        <div className="absolute right-[-50px] bottom-[-50px] w-[300px] h-[500px] bg-[#2A5BD7] rounded-[3rem] p-4 shadow-2xl transform rotate-[-10deg] border-8 border-[#133B99]">
                            <div className="bg-white/10 w-full h-full rounded-[2.5rem] p-6 flex flex-col gap-4">
                                <div className="w-16 h-16 bg-white rounded-full mx-auto" />
                                <div className="h-4 w-32 bg-white/20 rounded-full mx-auto" />

                                <div className="mt-8 space-y-3">
                                    <div className="h-14 w-full bg-white rounded-xl flex items-center justify-between px-4">
                                        <span className="font-bold text-[#133B99]">Join Newsletter</span>
                                        <MessageCircle className="w-5 h-5 text-[#133B99]" />
                                    </div>
                                    <div className="h-14 w-full bg-[#D2E823] rounded-xl flex items-center justify-between px-4">
                                        <span className="font-bold text-[#133B99]">Latest Video</span>
                                        <Share2 className="w-5 h-5 text-[#133B99]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default FeatureShowcaseGrid;
