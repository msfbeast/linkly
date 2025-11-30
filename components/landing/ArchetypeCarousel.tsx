import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const archetypes = [
    {
        name: "Sarah Jenkins",
        role: "Travel Photographer",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        color: "from-emerald-400 to-teal-500",
        bg: "bg-emerald-50",
        links: ["Portfolio", "Print Shop", "Lightroom Presets"]
    },
    {
        name: "TechStart Inc.",
        role: "SaaS Company",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
        color: "from-blue-400 to-indigo-500",
        bg: "bg-blue-50",
        links: ["Book Demo", "Documentation", "Careers"]
    },
    {
        name: "Chef Marco",
        role: "Culinary Artist",
        image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=400&fit=crop",
        color: "from-orange-400 to-red-500",
        bg: "bg-orange-50",
        links: ["Latest Recipes", "Cooking Class", "My Cookbook"]
    },
    {
        name: "Elena V.",
        role: "Digital Artist",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        color: "from-purple-400 to-pink-500",
        bg: "bg-purple-50",
        links: ["Commission Me", "Art Station", "NFT Collection"]
    }
];

const TiltCard = ({ item }: { item: typeof archetypes[0] }) => {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative w-80 h-[420px] rounded-[2rem] bg-white transition-all duration-200 ease-out group/card"
        >
            {/* Shadow Layer */}
            <div
                className="absolute inset-4 rounded-[1.5rem] bg-black/5 blur-2xl transform translate-z-[-20px] transition-opacity duration-500 group-hover/card:opacity-40"
                style={{ transform: "translateZ(-50px)" }}
            />

            {/* Card Content */}
            <div
                className="absolute inset-0 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white/60 overflow-hidden"
                style={{ transform: "translateZ(0px)" }}
            >
                {/* Dynamic Gradient Background */}
                <div className={`absolute inset-0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${item.color} mix-blend-overlay`} />

                {/* Holographic Glare */}
                <div
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                        background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%)",
                        transform: "translateZ(1px)",
                    }}
                />

                <div className="relative h-full p-8 flex flex-col">
                    {/* Header - Parallax Layer 1 */}
                    <div
                        className="flex items-center gap-4 mb-8"
                        style={{ transform: "translateZ(20px)" }}
                    >
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full blur-md opacity-40 bg-gradient-to-br ${item.color}`} />
                            <img
                                src={item.image}
                                alt={item.name}
                                className="relative w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-xl">{item.name}</h3>
                            <span className={`
                                text-xs px-3 py-1 rounded-full 
                                bg-gradient-to-r ${item.color} 
                                text-white font-bold tracking-wide uppercase shadow-sm
                            `}>
                                {item.role}
                            </span>
                        </div>
                    </div>

                    {/* Links - Parallax Layer 2 */}
                    <div
                        className="space-y-3 mt-auto"
                        style={{ transform: "translateZ(40px)" }}
                    >
                        {item.links.map((link, j) => (
                            <div
                                key={j}
                                className="
                                    w-full py-3.5 px-5 
                                    bg-white/80 hover:bg-slate-900 
                                    border border-stone-100 hover:border-slate-900
                                    rounded-xl 
                                    text-sm font-bold text-stone-600 hover:text-white 
                                    text-center 
                                    transition-all duration-200
                                    cursor-pointer
                                    shadow-sm hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5
                                    flex items-center justify-between group/link
                                    backdrop-blur-sm
                                "
                            >
                                <span>{link}</span>
                                <span className="opacity-0 group-hover/link:opacity-100 transition-opacity transform translate-x-2 group-hover/link:translate-x-0">→</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ArchetypeCarousel: React.FC = () => {
    return (
        <div className="w-full overflow-hidden py-32 relative perspective-1000">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl mx-auto px-6 mb-16 relative z-10">
                <h2 className="text-5xl font-extrabold text-slate-900 text-center mb-6 tracking-tight">
                    Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Everyone.</span>
                </h2>
                <p className="text-stone-500 text-center max-w-2xl mx-auto text-xl leading-relaxed">
                    Experience a profile that feels as unique as you are.
                </p>
            </div>

            <div className="relative flex overflow-x-hidden group py-10">
                <div className="flex animate-scroll gap-12 px-12 hover:pause pl-12">
                    {[...archetypes, ...archetypes].map((item, i) => (
                        <div key={i} className="perspective-1000">
                            <TiltCard item={item} />
                        </div>
                    ))}
                </div>

                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 h-full w-40 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent z-10 pointer-events-none" />
            </div>

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 60s linear infinite;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};

export default ArchetypeCarousel;
