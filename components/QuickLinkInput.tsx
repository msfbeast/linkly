import React, { useState } from 'react';
import { ArrowRight, Link as LinkIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickLinkInputProps {
    onCreate: (url: string) => Promise<void>;
    isLoading?: boolean;
}

const QuickLinkInput: React.FC<QuickLinkInputProps> = ({ onCreate, isLoading = false }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        // Basic URL validation/prefixing
        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        await onCreate(finalUrl);
        setUrl('');
    };

    return (
        <div className="w-full max-w-3xl mx-auto mb-12">
            <form onSubmit={handleSubmit} className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-stone-200/40 rounded-[2rem] blur-2xl transition-all duration-500 group-hover:bg-purple-200/30 -z-10" />

                <div className="relative flex flex-col sm:flex-row items-center bg-white rounded-[2rem] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-stone-100 transition-all duration-300 focus-within:shadow-[0_20px_40px_rgba(0,0,0,0.12)] focus-within:border-purple-100 focus-within:ring-4 focus-within:ring-purple-50 gap-2 sm:gap-0">
                    <div className="hidden sm:block pl-6 text-stone-400">
                        <LinkIcon className="w-6 h-6" />
                    </div>

                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your long link here..."
                        className="w-full sm:flex-1 bg-transparent border-none text-lg text-slate-900 placeholder:text-stone-400 focus:ring-0 px-4 py-4 min-w-0 font-medium"
                        disabled={isLoading}
                    />

                    <motion.button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-4 bg-[#E9D5FF] hover:bg-[#D8B4FE] text-purple-900 font-bold rounded-[1.5rem] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Shorten</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default QuickLinkInput;
