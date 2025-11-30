import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Github, Globe, Link as LinkIcon } from 'lucide-react';

const AuthVisuals: React.FC = () => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#E9C46A]">
            {/* Background Blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F4A261] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#2A9D8F] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-[#E76F51] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10 w-full max-w-lg">

                    {/* Floating Phone Mockup */}
                    <motion.div
                        animate={{
                            y: [-10, 10, -10],
                            rotate: [-1, 1, -1]
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative mx-auto w-64 h-[500px] bg-white rounded-[3rem] shadow-2xl border-8 border-slate-900 overflow-hidden"
                    >
                        {/* Phone Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

                        {/* Phone Screen Content */}
                        <div className="flex flex-col items-center pt-12 px-4 h-full bg-stone-50">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-stone-200 rounded-full mb-4 animate-pulse"></div>
                            {/* Name */}
                            <div className="w-32 h-4 bg-stone-200 rounded-full mb-2"></div>
                            <div className="w-24 h-3 bg-stone-200 rounded-full mb-8"></div>

                            {/* Link Buttons */}
                            <div className="w-full space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-full h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center px-4 gap-3">
                                        <div className="w-8 h-8 bg-stone-100 rounded-lg"></div>
                                        <div className="w-24 h-3 bg-stone-100 rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Icons Orbiting */}
                    <FloatingIcon icon={Instagram} color="text-pink-500" delay={0} x={-120} y={-100} />
                    <FloatingIcon icon={Twitter} color="text-blue-400" delay={1} x={140} y={-60} />
                    <FloatingIcon icon={Linkedin} color="text-blue-700" delay={2} x={-140} y={80} />
                    <FloatingIcon icon={Github} color="text-slate-800" delay={3} x={120} y={120} />

                    {/* Text Overlay */}
                    <div className="absolute -bottom-24 left-0 right-0 text-center">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2 font-display">One link to rule them all.</h3>
                        <p className="text-slate-800/80 max-w-xs mx-auto">Join millions of creators and share everything you create.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

const FloatingIcon = ({ icon: Icon, color, delay, x, y }: { icon: any, color: string, delay: number, x: number, y: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: 1,
            scale: 1,
            y: [y, y - 15, y],
        }}
        transition={{
            y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay
            },
            opacity: { duration: 0.5, delay: delay * 0.2 }
        }}
        className={`absolute top-1/2 left-1/2 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center ${color} z-20`}
        style={{ marginLeft: x, marginTop: y }}
    >
        <Icon className="w-7 h-7" />
    </motion.div>
);

export default AuthVisuals;
