import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BioErrorProps {
    message?: string;
    onRetry?: () => void;
}

export const BioError: React.FC<BioErrorProps> = ({ message = "Profile not found", onRetry }) => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h1>
            <p className="text-stone-500 max-w-md mb-8">
                {message}
            </p>

            <div className="flex gap-4">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
                    >
                        Try Again
                    </button>
                )}
                <Link
                    to="/"
                    className="px-6 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full font-medium hover:bg-stone-50 transition-colors"
                >
                    Go Home
                </Link>
            </div>

            <div className="mt-12 text-stone-400 text-sm">
                Powered by <strong>Linkly</strong>
            </div>
        </div>
    );
};
