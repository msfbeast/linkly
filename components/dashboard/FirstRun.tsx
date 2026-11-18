import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const input = 'w-full rounded-2xl bg-[#F0EEEA] px-4 py-3 text-[14px] text-[#18181A] outline-none placeholder:text-[#A19E97] focus:ring-2 focus:ring-[#FF5A14]/30';

const Step: React.FC<{ n: number; done?: boolean; title: string; children: React.ReactNode }> = ({ n, done, title, children }) => (
    <li className="grid grid-cols-[28px_1fr] gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-[12px] ${done ? 'bg-[#18181A] text-white' : 'bg-[#F0EEEA] text-[#5F5C56]'}`}>
            {done ? <Check className="h-3.5 w-3.5" aria-label="Done" /> : n}
        </span>
        <div className="min-w-0">
            <h3 className="text-[15px] font-medium leading-7">{title}</h3>
            <div className="mt-1 text-[14px] leading-relaxed text-[#5F5C56]">{children}</div>
        </div>
    </li>
);

/**
 * Shown on the dashboard until the first link exists. Most sign-ups never
 * made a link; this says what Gather does and gets the affiliate tags in
 * before the first link, since links only get the tags set at the time.
 */
const FirstRun: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const hasTags = !!(user?.amazonAssociateTag || user?.flipkartAffiliateId);
    const [amazon, setAmazon] = useState('');
    const [flipkart, setFlipkart] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amazon.trim() && !flipkart.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const result = await updateProfile({ amazonAssociateTag: amazon.trim(), flipkartAffiliateId: flipkart.trim() });
            if (!result.success) setError(result.error || 'Could not save the tags. Try again.');
        } catch {
            setError('Could not save the tags. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section aria-labelledby="first-run-title" className="rounded-3xl bg-[#FBFAF8] p-5 sm:p-7">
            <h2 id="first-run-title" className="text-[20px] font-medium tracking-tight">Get set up in a minute</h2>
            <p className="mt-1 text-[14px] text-[#8C8981]">Short links that earn: your affiliate tags go on every Amazon and Flipkart link, and you see every click.</p>

            <ol className="mt-6 grid gap-6">
                <Step n={1} done={hasTags} title="Add your affiliate tags">
                    {hasTags ? (
                        <p>Saved. Amazon and Flipkart links you shorten get them automatically. <Link to="/settings" className="underline underline-offset-2 hover:text-[#18181A]">Change in Settings</Link></p>
                    ) : (
                        <form onSubmit={save} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <label className="sr-only" htmlFor="fr-amazon">Amazon Associates tag</label>
                            <input id="fr-amazon" value={amazon} onChange={e => setAmazon(e.target.value)} placeholder="Amazon tag, e.g. yourname-21" className={input} autoComplete="off" />
                            <label className="sr-only" htmlFor="fr-flipkart">Flipkart affiliate ID</label>
                            <input id="fr-flipkart" value={flipkart} onChange={e => setFlipkart(e.target.value)} placeholder="Flipkart affiliate ID" className={input} autoComplete="off" />
                            <button type="submit" disabled={saving || (!amazon.trim() && !flipkart.trim())}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18181A] px-5 py-3 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-40">
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save tags
                            </button>
                            {error && <p role="alert" className="text-[13px] text-[#B42318] sm:col-span-3">{error}</p>}
                            <p className="text-[12px] text-[#A19E97] sm:col-span-3">No affiliate account? Skip this. Links work the same without tags.</p>
                        </form>
                    )}
                </Step>
                <Step n={2} title="Shorten a link">
                    <p>Paste any link in the box above.</p>
                    <div className="mt-2 grid gap-1 rounded-2xl bg-[#F3F2EF] p-3 font-mono text-[12px] leading-relaxed">
                        <span className="truncate text-[#8C8981]">amazon.in/dp/B0EXAMPLE?ref=…</span>
                        <span className="truncate text-[#18181A]">→ {window.location.host}/k3m9pqa <span className="text-[#C2410C]">{user?.amazonAssociateTag ? `tag=${user.amazonAssociateTag}` : 'tag=yourname-21'}</span></span>
                    </div>
                </Step>
                <Step n={3} title="Share it and watch the clicks">
                    <p>Post it anywhere. Every click shows up here: where it came from, on which device, and when.</p>
                </Step>
            </ol>
        </section>
    );
};

export default FirstRun;
