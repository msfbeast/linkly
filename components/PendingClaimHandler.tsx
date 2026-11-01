import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { getPendingClaim, clearPendingClaim } from '../utils/pendingClaim';

/**
 * Adds the guest link this browser made to the account of whoever signs in
 * here next, however they signed in. The claim page (/claim/:token) does
 * its own claiming, so this stays out of its way.
 */
export default function PendingClaimHandler() {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const tried = useRef<string | null>(null);

    useEffect(() => {
        if (!user || pathname.startsWith('/claim/')) return;
        const token = getPendingClaim();
        if (!token || tried.current === token) return;
        tried.current = token;

        supabaseAdapter.claimGuestLink(token, user.id)
            .then((link) => {
                clearPendingClaim();
                toast.success(`gather.link/${link.shortCode} is now in your account`);
            })
            .catch((err) => {
                console.warn('[claim] Pending guest link not claimed:', err);
                // The server said no (already claimed, bad token): don't retry.
                // A network failure keeps the token for the next page load.
                if (!(err instanceof TypeError)) clearPendingClaim();
            });
    }, [user, pathname]);

    return null;
}
