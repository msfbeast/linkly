import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                <p className="text-stone-500 font-medium animate-pulse">Loading Gather...</p>
            </div>
        </div>
    );
};

export default LoadingFallback;
