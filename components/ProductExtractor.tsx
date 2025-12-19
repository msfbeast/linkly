import React, { useState } from 'react';
import { extractProductMetadata } from '../services/extractionService';
import { Loader2, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductExtractorProps {
    onMetadataExtracted: (data: any) => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export const ProductExtractor: React.FC<ProductExtractorProps> = ({
    onMetadataExtracted,
    onCancel,
    isProcessing = false
}) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!url) {
            setError('Please enter a valid URL');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await extractProductMetadata(url);

            if (data) {
                onMetadataExtracted(data);
            } else {
                setError('Could not extract data from this URL.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to analyze URL. Please try entering details manually.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xl animate-scaleIn max-w-md w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Add Product via URL</h3>
                </div>
                <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Product Link</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="https://amazon.com/dp/..."
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !url}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto-Extract'}
                    </button>
                </div>

                <p className="text-center text-xs text-stone-400 mt-4">
                    Supports Amazon, Flipkart, Shopify & more.
                </p>
            </div>
        </div>
    );
};
