import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../services/storage/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const input = 'w-full rounded-2xl bg-[#F0EEEA] px-4 py-3 text-[14px] text-[#18181A] outline-none placeholder:text-[#A19E97] focus:ring-2 focus:ring-[#B42318]/30';

/**
 * Deletes the account through /api/account/delete after the user types
 * their email. Paid plans must be cancelled first (through support).
 */
const DeleteAccount: React.FC<{ isPaid: boolean; supportEmail: string }> = ({ isPaid, supportEmail }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const email = user?.email || '';
    const matches = !!email && typed.trim().toLowerCase() === email.toLowerCase();

    const remove = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matches) return;
        setBusy(true);
        setError(null);
        try {
            const { data } = await supabase!.auth.getSession();
            const token = data.session?.access_token;
            if (!token) { setError('Sign in again, then try once more.'); return; }
            const res = await fetch('/api/account/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ confirmEmail: typed.trim() }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(body.error === 'paid_plan'
                    ? `Cancel your plan first: email ${supportEmail}.`
                    : body.error || 'Could not delete your account. Try again.');
                return;
            }
            await signOut().catch(() => { /* the session is gone with the account */ });
            toast.success('Your account and everything in it has been deleted.');
            navigate('/', { replace: true });
        } catch {
            setError('Could not delete your account. Check your connection and try again.');
        } finally {
            setBusy(false);
        }
    };

    if (isPaid) {
        return (
            <p className="text-[13px] text-[#8C8981]">
                You're on a paid plan. To delete your account, email {supportEmail} and we'll cancel the plan and delete everything.
            </p>
        );
    }

    return (
        <>
            <p className="text-[13px] text-[#8C8981]">
                Deletes your links and their clicks, your store and bio page, products, tags, API keys and uploaded images. This can't be undone, and your short links stop working.
            </p>
            {!open ? (
                <div className="mt-auto pt-4">
                    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#FDECEA] px-4 py-2 text-[13px] font-medium text-[#B42318] hover:bg-[#FBDCD8]">
                        Delete account…
                    </button>
                </div>
            ) : (
                <form onSubmit={remove} className="mt-4 grid gap-2">
                    <label htmlFor="delete-confirm" className="text-[13px] text-[#18181A]">Type <span className="font-mono">{email}</span> to confirm</label>
                    <input id="delete-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className={input} />
                    {error && <p role="alert" className="text-[13px] text-[#B42318]">{error}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <button type="submit" disabled={!matches || busy}
                            className="inline-flex items-center gap-2 rounded-full bg-[#B42318] px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete my account
                        </button>
                        <button type="button" onClick={() => { setOpen(false); setTyped(''); setError(null); }} disabled={busy}
                            className="rounded-full bg-[#F0EEEA] px-4 py-2 text-[13px] text-[#18181A] hover:bg-[#E6E3DD]">
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </>
    );
};

export default DeleteAccount;
