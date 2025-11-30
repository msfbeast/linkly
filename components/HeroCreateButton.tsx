import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroCreateButtonProps {
    onClick: () => void;
}

const HeroCreateButton: React.FC<HeroCreateButtonProps> = ({ onClick }) => {
    return (
        <div className="w-full max-w-3xl mx-auto mb-12">
            <div className="relative group cursor-pointer" onClick={onClick}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-stone-200/40 rounded-[2rem] blur-2xl transition-all duration-500 group-hover:bg-purple-200/30 -z-10" />

                <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="relative flex items-center justify-between bg-white rounded-[2rem] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-stone-100 transition-all duration-300 group-hover:border-purple-100 group-hover:ring-4 group-hover:ring-purple-50"
                >
                    <div className="flex items-center gap-4 pl-6">
                        <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-medium text-stone-500 group-hover:text-slate-900 transition-colors">
                            Create a new link...
                        </span>
                    </div>

                    <div className="px-8 py-4 bg-[#E9D5FF] group-hover:bg-[#D8B4FE] text-purple-900 font-bold rounded-[1.5rem] transition-colors shadow-sm flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        <span>New Link</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroCreateButton;
