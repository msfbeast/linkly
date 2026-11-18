import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import PublicCard from '../components/PublicCard';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';
import { setPendingClaim, clearPendingClaim } from '../utils/pendingClaim';

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
                setError('This claim address is incomplete.');
                setLoading(false);
                return;
            }

            try {
                const guestLink = await supabaseAdapter.getGuestLinkByToken(token);
                if (!guestLink) {
                    setError('This link was already kept by an account, or it has expired.');
                } else {
                    setLink(guestLink);
                    // Kept until sign-in, so the link is claimed even if signing
                    // up goes through email confirmation or Google/GitHub.
                    setPendingClaim(token);
                }
            } catch (err) {
                console.error('Failed to load guest link:', err);
                setError('Something went wrong loading the link. Try again in a moment.');
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
                    clearPendingClaim();
                    setLink(claimedLink);
                    setClaimed(true);
                } catch (err) {
                    console.error('Failed to claim link:', err);
                    setError('Could not add the link to your account. Try again in a moment.');
                }
            }
        };

        claimLink();
    }, [user, link, claimed, token]);

    const shortLabel = link ? `${window.location.host}/${link.shortCode}` : '';
    const primary = 'flex w-full items-center justify-center rounded-full bg-[#FF5A14] py-3.5 text-[14px] font-medium text-white hover:opacity-90';
    const secondary = 'flex w-full items-center justify-center rounded-full bg-[#F0EEEA] py-3.5 text-[14px] hover:bg-[#E6E3DD]';

    const LinkBox = () => link ? (
        <div className="mt-5 rounded-2xl bg-[#18181A] p-4 text-[#F2F1EE]">
            <div className="truncate font-mono text-[15px]">{shortLabel}</div>
            <div className="mt-1 truncate font-mono text-[11px] text-[#77746D]">→ {link.originalUrl}</div>
            {link.clicks > 0 && <div className="mt-3 font-mono text-[13px] text-[#FF9B6A]">{link.clicks.toLocaleString('en-IN')} clicks so far</div>}
        </div>
    ) : null;

    // Loading, or signed in and the claim is still on its way.
    if (loading || (user && link && !claimed && !error)) {
        return (
            <PublicCard>
                <p className="flex items-center gap-3 text-[15px]" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-[#FF5A14]" /> {loading ? 'Loading your link…' : 'Adding it to your account…'}
                </p>
            </PublicCard>
        );
    }

    if (error) {
        return (
            <PublicCard>
                <h1 className="text-[22px] font-medium tracking-tight">Can't keep this link</h1>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5F5C56]">{error}</p>
                <button onClick={() => navigate('/')} className={`${primary} mt-6`}>Shorten a new link</button>
            </PublicCard>
        );
    }

    if (!user) {
        return (
            <PublicCard>
                <h1 className="text-[22px] font-medium tracking-tight">Keep this link</h1>
                <p className="mt-1.5 text-[14px] text-[#8C8981]">Sign up free to keep it past 7 days and see its clicks.</p>
                <LinkBox />
                <div className="mt-6 grid gap-2">
                    <button onClick={() => navigate('/register')} className={primary}>Sign up free</button>
                    <button onClick={() => navigate('/login', { state: { from: `/claim/${token}` } })} className={secondary}>I have an account</button>
                </div>
            </PublicCard>
        );
    }

    if (claimed) {
        return (
            <PublicCard>
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5A14] text-white"><Check className="h-5 w-5" /></span>
                <h1 className="text-[22px] font-medium tracking-tight">It's yours</h1>
                <p className="mt-1.5 text-[14px] text-[#8C8981]">The link is in your account now and won't expire.</p>
                <LinkBox />
                <div className="mt-6 grid gap-2">
                    <button onClick={() => navigate(`/analytics/${link?.id}`)} className={primary}>See its clicks</button>
                    <button onClick={() => navigate('/dashboard')} className={secondary}>Go to dashboard</button>
                </div>
            </PublicCard>
        );
    }

    return null;
};

export default ClaimLinkPage;
