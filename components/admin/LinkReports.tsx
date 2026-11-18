import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../services/storage/supabaseClient';

interface OpenReport {
    linkId: string;
    shortCode: string;
    title: string | null;
    originalUrl: string;
    clicks: number;
    isGuest: boolean;
    ownerEmail: string | null;
    disabledAt: string | null;
    reports: number;
    reporters: number;
    latest: string;
    items: { reason: string; details: string | null; at: string }[];
}
interface DisabledLink {
    linkId: string;
    shortCode: string;
    title: string | null;
    originalUrl: string;
    disabledAt: string;
    reason: string | null;
}

/** Reported links waiting for a decision, and the links taken down so far. */
const LinkReports: React.FC = () => {
    const [open, setOpen] = useState<OpenReport[] | null>(null);
    const [disabled, setDisabled] = useState<DisabledLink[]>([]);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        const { data, error } = await supabase!.rpc('admin_link_reports');
        if (error) {
            console.error('admin_link_reports failed', error);
            toast.error('Could not load reports');
            setOpen([]);
            return;
        }
        setOpen((data?.open ?? []) as OpenReport[]);
        setDisabled((data?.disabled ?? []) as DisabledLink[]);
    }, []);

    useEffect(() => { load(); }, [load]);

    const act = async (linkId: string, action: 'disable' | 'enable' | 'dismiss', reason?: string) => {
        setBusy(linkId + action);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/admin/moderate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
                body: JSON.stringify({ linkId, action, reason }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'Failed');
            toast.success(action === 'disable' ? 'Link disabled' : action === 'enable' ? 'Link enabled again' : 'Reports dismissed');
            await load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed');
        } finally {
            setBusy(null);
        }
    };

    const reasonLabel = (items: OpenReport['items']) => {
        const counts = new Map<string, number>();
        items.forEach(i => counts.set(i.reason, (counts.get(i.reason) ?? 0) + 1));
        return [...counts.entries()].map(([r, n]) => (n > 1 ? `${r} ×${n}` : r)).join(', ');
    };

    return (
        <div className="overflow-hidden rounded-3xl bg-[#FBFAF8]">
            <div className="flex items-center justify-between border-b border-[#ECEAE6] p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#18181A]">
                    <Flag className="h-5 w-5 text-orange-600" /> Reported links
                    {open && open.length > 0 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">{open.length} open</span>}
                </h2>
                <button onClick={load} className="text-sm text-[#8C8981] hover:text-[#18181A]">Refresh</button>
            </div>

            {open === null ? (
                <div className="p-6 text-sm text-[#8C8981]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading…</div>
            ) : open.length === 0 ? (
                <p className="p-6 text-sm text-[#8C8981]">No open reports.</p>
            ) : (
                <ul className="divide-y divide-[#ECEAE6]">
                    {open.map(r => (
                        <li key={r.linkId} className="flex flex-col gap-3 p-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-[#18181A]">/{r.shortCode}</span>
                                    {r.disabledAt && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-700">disabled</span>}
                                    {r.isGuest && <span className="rounded bg-[#F0EEEA] px-1.5 py-0.5 text-[11px] text-[#5F5C56]">guest link</span>}
                                    <span className="text-xs text-[#8C8981]">{r.reports} report{r.reports === 1 ? '' : 's'} from {r.reporters} {r.reporters === 1 ? 'visitor' : 'visitors'} · {reasonLabel(r.items)}</span>
                                </div>
                                <a href={r.originalUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 flex items-center gap-1 truncate font-mono text-xs text-[#8C8981] hover:text-[#18181A]">
                                    <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{r.originalUrl}</span>
                                </a>
                                <p className="mt-1 text-xs text-[#8C8981]">{r.ownerEmail ?? 'No owner'} · {r.clicks.toLocaleString()} clicks · last report {new Date(r.latest).toLocaleString()}</p>
                                {r.items.filter(i => i.details).slice(0, 3).map((i, n) => (
                                    <p key={n} className="mt-1 rounded bg-[#F3F2EF] px-2 py-1 text-xs text-[#5F5C56]">“{i.details}”</p>
                                ))}
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <button
                                    onClick={() => act(r.linkId, 'disable', reasonLabel(r.items))}
                                    disabled={!!busy}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {busy === r.linkId + 'disable' ? 'Disabling…' : 'Disable link'}
                                </button>
                                <button
                                    onClick={() => act(r.linkId, 'dismiss')}
                                    disabled={!!busy}
                                    className="rounded-lg border border-[#E2DFD8] px-3 py-1.5 text-sm font-medium text-[#5F5C56] hover:bg-[#F3F2EF] disabled:opacity-50"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {disabled.length > 0 && (
                <details className="border-t border-[#ECEAE6]">
                    <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-[#5F5C56]">Disabled links ({disabled.length})</summary>
                    <ul className="divide-y divide-[#ECEAE6]">
                        {disabled.map(d => (
                            <li key={d.linkId} className="flex items-center justify-between gap-3 px-6 py-3">
                                <div className="min-w-0">
                                    <span className="font-mono text-sm text-[#18181A]">/{d.shortCode}</span>
                                    <span className="ml-2 text-xs text-[#8C8981]">{d.reason} · {new Date(d.disabledAt).toLocaleDateString()}</span>
                                    <p className="truncate font-mono text-xs text-[#8C8981]">{d.originalUrl}</p>
                                </div>
                                <button
                                    onClick={() => act(d.linkId, 'enable')}
                                    disabled={!!busy}
                                    className="shrink-0 rounded-lg border border-[#E2DFD8] px-3 py-1.5 text-sm text-[#5F5C56] hover:bg-[#F3F2EF] disabled:opacity-50"
                                >
                                    Enable again
                                </button>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
};

export default LinkReports;
