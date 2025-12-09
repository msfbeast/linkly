import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';

const ClaimLinkPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [link, setLink] = useState<LinkData | null>(null);
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load guest link by token
    useEffect(() => {
        const loadGuestLink = async () => {
            if (!token) {
                setError('Invalid claim link');
                setLoading(false);
                return;
            }

            try {
                const guestLink = await supabaseAdapter.getGuestLinkByToken(token);
                if (!guestLink) {
                    setError('Link not found or already claimed');
                } else {
                    setLink(guestLink);
                }
            } catch (err) {
                console.error('Failed to load guest link:', err);
                setError('Failed to load link');
            } finally {
                setLoading(false);
            }
        };

        loadGuestLink();
    }, [token]);

    // Auto-claim if user is logged in
    useEffect(() => {
        const claimLink = async () => {
            if (user && link && !claimed && token) {
                try {
                    const claimedLink = await supabaseAdapter.claimGuestLink(token, user.id);
                    setLink(claimedLink);
                    setClaimed(true);
                } catch (err) {
                    console.error('Failed to claim link:', err);
                    setError('Failed to claim link');
                }
            }
        };

        claimLink();
    }, [user, link, claimed, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                    <p className="text-stone-500">Loading your link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
                <div className="bg-white border-2 border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Not Found</h1>
                    <p className="text-stone-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors"
                    >
                        Create New Link
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
                <div className="bg-white border-2 border-yellow-400 rounded-2xl p-8 max-w-md w-full shadow-xl">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LinkIcon className="w-8 h-8 text-yellow-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                        Claim Your Link
                    </h1>
                    <p className="text-stone-500 mb-6 text-center">
                        Sign up to claim this link and see its analytics
                    </p>

                    {link && (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-stone-500">Short URL</span>
                                <span className="font-mono text-sm text-slate-900">
                                    gather.link/{link.shortCode}
                                </span>
                            </div>
                            {link.clicks > 0 && (
                                <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm font-bold text-slate-900">
                                        {link.clicks} clicks already!
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/register?claim=${token}`)}
                            className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-lg shadow-yellow-400/20"
                        >
                            Sign Up to Claim
                        </button>
                        <button
                            onClick={() => navigate(`/login?claim=${token}`)}
                            className="w-full px-6 py-3 bg-stone-100 hover:bg-stone-200 text-slate-900 font-medium rounded-xl transition-colors"
                        >
                            Already have an account? Log in
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (claimed) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
                <div className="bg-white border-2 border-green-400 rounded-2xl p-8 max-w-md w-full text-center shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Link Claimed! 🎉
                    </h1>
                    <p className="text-stone-500 mb-6">
                        Your link has been added to your account
                    </p>

                    {link && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                            <div className="text-sm text-green-800 mb-2">
                                gather.link/{link.shortCode}
                            </div>
                            {link.clicks > 0 && (
                                <div className="text-2xl font-bold text-green-900">
                                    {link.clicks} clicks tracked
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => navigate(`/analytics/${link?.id}`)}
                            className="w-full px-6 py-3 bg-stone-100 hover:bg-stone-200 text-slate-900 font-medium rounded-xl transition-colors"
                        >
                            View Analytics
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ClaimLinkPage;
