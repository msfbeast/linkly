import React, { useState } from 'react';
import { ArrowRight, Loader2, SlidersHorizontal } from 'lucide-react';

interface QuickLinkInputProps {
    /** Creates a link for the (already https-prefixed) URL. */
    onCreate: (url: string) => Promise<void>;
    /** Opens the full create form (custom code, password, expiry, …). */
    onMoreOptions?: () => void;
}

/** Paste a long URL, get a short link. The dashboard's main action. */
const QuickLinkInput: React.FC<QuickLinkInputProps> = ({ onCreate, onMoreOptions }) => {
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const raw = url.trim();
        if (!raw || busy) return;
        const finalUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        setBusy(true);
        try {
            await onCreate(finalUrl);
            setUrl('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-3xl bg-[#FBFAF8] p-2 sm:flex-row sm:items-center">
            <label htmlFor="quick-link-url" className="sr-only">Long URL to shorten</label>
            <input
                id="quick-link-url"
                type="text"
                inputMode="url"
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a long link to shorten"
                disabled={busy}
                className="min-w-0 flex-1 rounded-2xl border-none bg-transparent px-4 py-3 text-[15px] text-[#18181A] placeholder:text-[#A19E97] focus:outline-none focus:ring-0"
            />
            <div className="flex gap-2">
                {onMoreOptions && (
                    <button
                        type="button"
                        onClick={onMoreOptions}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#F0EEEA] px-4 text-[13px] font-medium text-[#4A4843] transition-colors hover:bg-[#E6E3DD] sm:flex-none"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>Options</span>
                    </button>
                )}
                <button
                    type="submit"
                    disabled={busy || !url.trim()}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#18181A] px-5 text-[13px] font-semibold text-[#F2F1EE] transition-colors hover:bg-[#2B2B2E] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Shorten</span><ArrowRight className="h-4 w-4" /></>}
                </button>
            </div>
        </form>
    );
};

export default QuickLinkInput;
