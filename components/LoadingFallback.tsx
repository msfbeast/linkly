import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-bounce">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <p className="text-stone-500 font-bold animate-pulse tracking-wide">Linkly</p>
            </div>
        </div>
    );
};

export default LoadingFallback;
