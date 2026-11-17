import React, { useCallback, useEffect, useState } from 'react';
import { Bug, Loader2 } from 'lucide-react';
import { supabase } from '../../services/storage/supabaseClient';

interface LoggedError {
    fingerprint: string;
    source: 'browser' | 'server';
    message: string;
    stack: string | null;
    path: string | null;
    release: string | null;
    userAgent: string | null;
    count: number;
    firstSeen: string;
    lastSeen: string;
}

const ago = (iso: string) => {
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
};

/** Browser and server errors from public.error_log, grouped by fingerprint. */
const RecentErrors: React.FC = () => {
    const [days, setDays] = useState(7);
    const [errors, setErrors] = useState<LoggedError[] | null>(null);
    const [open, setOpen] = useState<string | null>(null);

    const load = useCallback(async () => {
        setErrors(null);
        const { data, error } = await supabase!.rpc('admin_recent_errors', { p_days: days });
        if (error) {
            console.error('admin_recent_errors failed', error);
            setErrors([]);
            return;
        }
        setErrors((data ?? []) as LoggedError[]);
    }, [days]);

    useEffect(() => { load(); }, [load]);

    const total = errors?.reduce((s, e) => s + e.count, 0) ?? 0;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Bug className="h-5 w-5 text-red-600" /> Errors
                    {errors && errors.length > 0 && <span className="text-sm font-normal text-slate-500">{errors.length} kinds, {total.toLocaleString()} times</span>}
                </h2>
                <div className="flex items-center gap-2">
                    {[1, 7, 30].map(d => (
                        <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
                            className={`rounded-lg px-2.5 py-1 text-sm ${days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                            {d === 1 ? '24h' : `${d}d`}
                        </button>
                    ))}
                    <button onClick={load} className="ml-2 text-sm text-slate-500 hover:text-slate-900">Refresh</button>
                </div>
            </div>
            {errors === null ? (
                <div className="p-6 text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div>
            ) : errors.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No errors in this period.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {errors.map(e => (
                        <li key={e.fingerprint} className="px-6 py-3">
                            <button onClick={() => setOpen(open === e.fingerprint ? null : e.fingerprint)} className="flex w-full items-start gap-3 text-left" aria-expanded={open === e.fingerprint}>
                                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] ${e.source === 'server' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>{e.source}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-mono text-sm text-slate-900">{e.message}</span>
                                    <span className="block text-xs text-slate-500">{e.path || '–'} · last {ago(e.lastSeen)} · first {ago(e.firstSeen)}{e.release ? ` · ${e.release}` : ''}</span>
                                </span>
                                <span className="shrink-0 font-mono text-sm text-slate-700">×{e.count.toLocaleString()}</span>
                            </button>
                            {open === e.fingerprint && (
                                <div className="mt-2 space-y-2 pl-14">
                                    {e.stack && <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">{e.stack}</pre>}
                                    {e.userAgent && <p className="break-all text-[11px] text-slate-400">{e.userAgent}</p>}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentErrors;
