import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Flag, Loader2 } from 'lucide-react';

const REASONS: { value: string; label: string; hint: string }[] = [
    { value: 'phishing', label: 'Phishing', hint: 'Pretends to be a bank, shop or login page to steal details' },
    { value: 'malware', label: 'Malware', hint: 'Downloads a virus or harmful app' },
    { value: 'scam', label: 'Scam or fraud', hint: 'Fake offers, fake giveaways, money requests' },
    { value: 'spam', label: 'Spam', hint: 'Sent in bulk or unwanted' },
    { value: 'adult', label: 'Adult content', hint: 'Without a warning' },
    { value: 'other', label: 'Something else', hint: 'Tell us below' },
];

/** Anyone can report a short link; staff review reports in the admin dashboard. */
const ReportLink: React.FC = () => {
    const [params] = useSearchParams();
    const [link, setLink] = useState(params.get('link') || params.get('code') || '');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!link.trim()) return setError('Enter the short link you want to report.');
        if (!reason) return setError('Choose a reason.');
        setBusy(true);
        try {
            const res = await fetch('/api/link/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: link, reason, details }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not send the report');
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send the report');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen items-start justify-center bg-[#ECEBE7] px-4 py-10 text-[#18181A] sm:items-center">
            <main className="w-full max-w-lg rounded-3xl bg-[#FBFAF8] p-6 sm:p-8">
                {sent ? (
                    <div className="py-6 text-center">
                        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
                        <h1 className="text-[22px] font-semibold">Thanks, we got your report</h1>
                        <p className="mt-2 text-[14px] text-[#6E6B65]">We review reports and disable links that break our rules. We don't reply to each report.</p>
                        <a href="/" className="mt-6 inline-block text-[14px] font-medium underline underline-offset-2">Back to Gather</a>
                    </div>
                ) : (
                    <form onSubmit={submit} noValidate>
                        <div className="mb-6 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE9DE] text-[#C2410C]"><Flag className="h-5 w-5" /></span>
                            <div>
                                <h1 className="text-[22px] font-semibold leading-tight">Report a link</h1>
                                <p className="text-[13px] text-[#8C8981]">Tell us about a Gather short link that leads somewhere harmful.</p>
                            </div>
                        </div>

                        <label htmlFor="report-link" className="mb-1.5 block text-[12px] font-medium text-[#8C8981]">Short link</label>
                        <input
                            id="report-link"
                            value={link}
                            onChange={e => setLink(e.target.value)}
                            placeholder={`${window.location.host}/abc123`}
                            className="mb-5 w-full rounded-2xl border border-[#E6E3DD] bg-white px-3.5 py-2.5 font-mono text-[14px] focus:border-[#18181A] focus:outline-none"
                        />

                        <fieldset className="mb-5">
                            <legend className="mb-1.5 text-[12px] font-medium text-[#8C8981]">What's wrong with it?</legend>
                            <div className="grid gap-2">
                                {REASONS.map(r => (
                                    <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-2.5 ${reason === r.value ? 'border-[#18181A] bg-white' : 'border-[#E6E3DD] bg-white/60 hover:bg-white'}`}>
                                        <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-1 accent-[#18181A]" />
                                        <span>
                                            <span className="block text-[14px] font-medium">{r.label}</span>
                                            <span className="block text-[12px] text-[#8C8981]">{r.hint}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label htmlFor="report-details" className="mb-1.5 block text-[12px] font-medium text-[#8C8981]">Anything else? (optional)</label>
                        <textarea
                            id="report-details"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            className="mb-5 w-full resize-y rounded-2xl border border-[#E6E3DD] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#18181A] focus:outline-none"
                        />

                        {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">{error}</p>}

                        <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#18181A] text-[14px] font-semibold text-[#F2F1EE] hover:bg-[#2B2B2E] disabled:opacity-50">
                            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send report
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
};

export default ReportLink;
