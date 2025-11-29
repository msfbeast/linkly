import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Copy, Check, RefreshCw, Tag } from 'lucide-react';

interface UTMBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseUrl: string;
    onApply: (url: string) => void;
}

const UTMBuilderModal: React.FC<UTMBuilderModalProps> = ({ isOpen, onClose, baseUrl, onApply }) => {
    const [source, setSource] = useState('');
    const [medium, setMedium] = useState('');
    const [campaign, setCampaign] = useState('');
    const [term, setTerm] = useState('');
    const [content, setContent] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);

    // Parse existing UTMs from baseUrl on open
    useEffect(() => {
        if (isOpen && baseUrl) {
            try {
                const url = new URL(baseUrl);
                const params = new URLSearchParams(url.search);
                setSource(params.get('utm_source') || '');
                setMedium(params.get('utm_medium') || '');
                setCampaign(params.get('utm_campaign') || '');
                setTerm(params.get('utm_term') || '');
                setContent(params.get('utm_content') || '');
            } catch (e) {
                // Invalid URL, just ignore
            }
        }
    }, [isOpen, baseUrl]);

    // Generate URL whenever inputs change
    useEffect(() => {
        if (!baseUrl) return;
        try {
            const url = new URL(baseUrl);
            const params = new URLSearchParams(url.search);

            if (source) params.set('utm_source', source); else params.delete('utm_source');
            if (medium) params.set('utm_medium', medium); else params.delete('utm_medium');
            if (campaign) params.set('utm_campaign', campaign); else params.delete('utm_campaign');
            if (term) params.set('utm_term', term); else params.delete('utm_term');
            if (content) params.set('utm_content', content); else params.delete('utm_content');

            url.search = params.toString();
            setGeneratedUrl(url.toString());
        } catch (e) {
            setGeneratedUrl(baseUrl);
        }
    }, [baseUrl, source, medium, campaign, term, content]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const applyTemplate = (template: { source: string, medium: string }) => {
        setSource(template.source);
        setMedium(template.medium);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">UTM Parameter Builder</h2>
                                <p className="text-xs text-stone-500 font-medium">Add tracking parameters to your URL</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                        {/* Templates */}
                        <div>
                            <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-3 block">Quick Templates</label>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => applyTemplate({ source: 'facebook', medium: 'cpc' })} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100">
                                    Facebook Ad
                                </button>
                                <button onClick={() => applyTemplate({ source: 'twitter', medium: 'social' })} className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors border border-sky-100">
                                    Twitter Post
                                </button>
                                <button onClick={() => applyTemplate({ source: 'linkedin', medium: 'social' })} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-100">
                                    LinkedIn
                                </button>
                                <button onClick={() => applyTemplate({ source: 'newsletter', medium: 'email' })} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-100">
                                    Email Newsletter
                                </button>
                                <button onClick={() => applyTemplate({ source: 'google', medium: 'organic' })} className="px-3 py-1.5 rounded-lg bg-stone-50 text-stone-600 text-xs font-medium hover:bg-stone-100 transition-colors border border-stone-200">
                                    SEO / Organic
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Campaign Source (utm_source) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. google, newsletter"
                                    className="w-full bg-stone-50 border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    value={source}
                                    onChange={e => setSource(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Campaign Medium (utm_medium) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. cpc, banner, email"
                                    className="w-full bg-stone-50 border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    value={medium}
                                    onChange={e => setMedium(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Campaign Name (utm_campaign) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. spring_sale"
                                    className="w-full bg-stone-50 border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    value={campaign}
                                    onChange={e => setCampaign(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Campaign Term (utm_term)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. running+shoes"
                                    className="w-full bg-stone-50 border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    value={term}
                                    onChange={e => setTerm(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Campaign Content (utm_content)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. logolink, textlink"
                                    className="w-full bg-stone-50 border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-stone-900 rounded-xl p-4 relative group">
                            <label className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-2 block">Generated URL</label>
                            <div className="font-mono text-sm text-stone-300 break-all pr-8">
                                {generatedUrl || 'Enter parameters to generate URL...'}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-slate-900 hover:bg-stone-200/50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onApply(generatedUrl);
                                onClose();
                            }}
                            disabled={!generatedUrl}
                            className="px-6 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Apply to Link
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UTMBuilderModal;
