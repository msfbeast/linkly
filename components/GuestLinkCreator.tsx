import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';
import SaveLinkModal from './SaveLinkModal';

interface GuestLinkCreatorProps {
    onLinkCreated?: (link: LinkData) => void;
}

const GuestLinkCreator: React.FC<GuestLinkCreatorProps> = ({ onLinkCreated }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [createdLink, setCreatedLink] = useState<LinkData | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Show "Save your link" modal after 30 seconds
    useEffect(() => {
        if (createdLink && !showSaveModal) {
            const timer = setTimeout(() => {
                setShowSaveModal(true);
            }, 30000); // 30 seconds

            return () => clearTimeout(timer);
        }
    }, [createdLink, showSaveModal]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url) {
            setError('Please enter a URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
            const link = await supabaseAdapter.createGuestLink(normalizedUrl);
            setCreatedLink(link);
            onLinkCreated?.(link);
            setUrl('');
        } catch (err) {
            console.error('Failed to create guest link:', err);
            setError('Failed to create link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!createdLink) return;

        const shortUrl = `${window.location.origin}/${createdLink.shortCode}`;
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-yellow-200">
                    <Sparkles className="w-4 h-4" />
                    No signup required
                </div>

                <h1 className="text-5xl font-bold text-slate-900 mb-4">
                    Shorten a link in seconds
                </h1>
                <p className="text-xl text-stone-500 mb-8">
                    Create short, trackable links instantly. No account needed.
                </p>
            </div>

            {/* Link Creator Form */}
            {!createdLink ? (
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Paste your long URL here"
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-200 rounded-2xl text-slate-900 text-lg focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all shadow-sm"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-stone-200 disabled:text-stone-400 text-slate-900 font-bold rounded-2xl transition-all shadow-lg shadow-yellow-400/20 hover:shadow-yellow-500/30 disabled:shadow-none whitespace-nowrap"
                        >
                            {loading ? 'Creating...' : 'Shorten'}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}
                </form>
            ) : (
                /* Success State */
                <div className="bg-white border-2 border-yellow-400 rounded-2xl p-8 shadow-xl shadow-yellow-400/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Your link is ready!</h3>
                            <p className="text-stone-500 text-sm">Share it anywhere</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
                        <ExternalLink className="w-5 h-5 text-stone-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={`${window.location.origin}/${createdLink.shortCode}`}
                            readOnly
                            className="flex-1 bg-transparent text-slate-900 font-medium outline-none"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setCreatedLink(null)}
                            className="flex-1 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-slate-900 font-medium rounded-xl transition-colors"
                        >
                            Create Another
                        </button>
                        <button
                            onClick={() => window.location.href = '/register'}
                            className="flex-1 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-sm shadow-yellow-400/20"
                        >
                            Sign Up to Track Clicks
                        </button>
                    </div>

                    <p className="text-center text-stone-500 text-sm mt-4">
                        This link expires in 7 days. Sign up to keep it forever!
                    </p>
                </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Instant Creation</h3>
                    <p className="text-stone-500 text-sm">No signup required. Create links in seconds.</p>
                </div>

                <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Link className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Short & Clean</h3>
                    <p className="text-stone-500 text-sm">Beautiful short links perfect for sharing.</p>
                </div>

                <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Track Everything</h3>
                    <p className="text-stone-500 text-sm">Sign up to see clicks, devices, and more.</p>
                </div>
            </div>

            {/* Save Link Modal */}
            {createdLink && (
                <SaveLinkModal
                    link={createdLink}
                    isOpen={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    onSignup={() => window.location.href = '/register'}
                />
            )}
        </div>
    );
};

export default GuestLinkCreator;
