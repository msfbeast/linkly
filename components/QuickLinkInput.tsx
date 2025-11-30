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
        <div className="w-full max-w-3xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-0 bg-stone-200/50 rounded-2xl blur-xl transition-all duration-300 group-hover:bg-stone-300/50 -z-10" />

                <div className="relative flex flex-col sm:flex-row items-center bg-white rounded-2xl p-2 shadow-sm border border-stone-200 transition-all duration-300 focus-within:shadow-md focus-within:border-stone-300 focus-within:ring-4 focus-within:ring-stone-100 gap-2 sm:gap-0">
                    <div className="hidden sm:block pl-4 text-stone-400">
                        <LinkIcon className="w-5 h-5" />
                    </div>

                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your long link here..."
                        className="w-full sm:flex-1 bg-transparent border-none text-base sm:text-lg text-slate-900 placeholder:text-stone-400 focus:ring-0 px-4 py-3 min-w-0"
                        disabled={isLoading}
                    />

                    <motion.button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-[#E0B0FF] hover:bg-[#D499FF] text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        style={{ backgroundColor: '#E0B0FF' }}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Shorten</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default QuickLinkInput;
