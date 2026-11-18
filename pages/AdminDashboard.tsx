import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../services/storage/supabaseClient';
import { Label, MonoPill, Tile, fmt } from '../components/ui/bento';
import LinkReports from '../components/admin/LinkReports';
import RecentErrors from '../components/admin/RecentErrors';

export interface AdminUser {
    id: string;
    email: string | null;
    name: string;
    username: string;
    plan: string;
    role: string;
    joined: string;
    lastSignIn: string | null;
    links: number;
    clicks: number;
}

export interface AdminOverview {
    stats: {
        users: number; usersLast30d: number; activeLast30d: number;
        links: number; linksLast30d: number; guestLinks: number;
        clicksLast7d: number; plans: Record<string, number>;
    };
    users: AdminUser[];
}

const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Platform numbers, reports, errors and users (admin_overview, admin only). */
export default function AdminDashboard() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [failed, setFailed] = useState(false);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [loading, setLoading] = useState(true);

    // Search runs on the server, over every user, a moment after typing stops.
    useEffect(() => {
        const t = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            const { data: result, error } = await supabase!.rpc('admin_overview', { p_search: query || null, p_limit: 200 });
            if (cancelled) return;
            if (error) { console.error('[Admin] admin_overview failed', error); setFailed(true); }
            else { setData(result as AdminOverview); setFailed(false); }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [query, attempt]);

    const s = data?.stats;
    const paid = s ? Object.entries(s.plans).filter(([p]) => p !== 'free') : [];

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-5 flex flex-wrap items-end gap-3">
                    <div>
                        <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Admin</h1>
                        <p className="mt-1 text-[13px] text-[#8C8981]">Platform numbers, reports, errors and users.</p>
                    </div>
                    <button onClick={() => setAttempt(n => n + 1)} className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#FBFAF8] px-4 py-2 text-[13px] hover:bg-white">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {failed && (
                    <div className="mb-3.5 flex items-center justify-between gap-4 rounded-2xl bg-[#FBFAF8] px-5 py-3 text-sm text-[#B42318]">
                        <span>Couldn't load the platform numbers.</span>
                        <button onClick={() => setAttempt(n => n + 1)} className="font-semibold underline underline-offset-2">Try again</button>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    <Tile dark className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-12">
                        {[
                            ['Users', s?.users, s ? `+${fmt(s.usersLast30d)} in 30 days` : ''],
                            ['Signed in, 30 days', s?.activeLast30d, s && s.users ? `${Math.round((s.activeLast30d / s.users) * 100)}% of users` : ''],
                            ['Links', s?.links, s ? `+${fmt(s.linksLast30d)} in 30 days · ${fmt(s.guestLinks)} guest` : ''],
                            ['Clicks, 7 days', s?.clicksLast7d, 'all links'],
                        ].map(([label, value, sub]) => (
                            <div key={label as string}>
                                <Label dark>{label}</Label>
                                <div className="font-mono text-[clamp(28px,3.5vw,44px)] font-medium leading-none tracking-[-0.04em]">{value === undefined ? '–' : fmt(Number(value))}</div>
                                <p className="mt-2 text-[12px] text-[#8E8B84]">{sub}</p>
                            </div>
                        ))}
                    </Tile>

                    <Tile className="lg:col-span-12">
                        <Label right={<MonoPill>comp accounts included</MonoPill>}>Plans</Label>
                        <div className="flex flex-wrap gap-2">
                            {s && Object.entries(s.plans).sort((a, b) => b[1] - a[1]).map(([plan, n]) => (
                                <span key={plan} className="rounded-full bg-[#F0EEEA] px-3 py-1.5 text-[13px] capitalize">{plan} <span className="font-mono text-[#8C8981]">{fmt(n)}</span></span>
                            ))}
                            {s && paid.length === 0 && <span className="text-[13px] text-[#8C8981]">No paid plans.</span>}
                        </div>
                    </Tile>
                </div>

                <div className="mt-3.5 grid gap-3.5">
                    <LinkReports />
                    <RecentErrors />
                </div>

                <Tile className="mt-3.5">
                    <Label right={
                        <span className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A19E97]" />
                            <label htmlFor="user-search" className="sr-only">Search users</label>
                            <input id="user-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Email, name or username"
                                className="w-56 rounded-full bg-[#F0EEEA] py-2 pl-9 pr-3 text-[13px] text-[#18181A] outline-none focus:ring-2 focus:ring-[#FF5A14]/30 sm:w-72" />
                        </span>
                    }>Users{data ? ` · ${fmt(data.users.length)}${data.users.length >= 200 ? '+' : ''} shown` : ''}</Label>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-[13px]">
                            <thead>
                                <tr className="text-[11px] text-[#8C8981]">
                                    <th className="pb-2 pr-4 font-normal">User</th>
                                    <th className="pb-2 pr-4 font-normal">Plan</th>
                                    <th className="pb-2 pr-4 text-right font-normal">Links</th>
                                    <th className="pb-2 pr-4 text-right font-normal">Clicks</th>
                                    <th className="pb-2 pr-4 font-normal">Joined</th>
                                    <th className="pb-2 font-normal">Last sign-in</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!data && loading && (
                                    <tr><td colSpan={6} className="py-6 text-center text-[#8C8981]"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
                                )}
                                {data && data.users.length === 0 && (
                                    <tr><td colSpan={6} className="py-6 text-center text-[#8C8981]">No users match.</td></tr>
                                )}
                                {data?.users.map(u => (
                                    <tr key={u.id} className="border-t border-[#ECEAE6]">
                                        <td className="py-2.5 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{u.name || u.username || u.email}</span>
                                                {u.role !== 'user' && <span className="rounded-md bg-[#18181A] px-1.5 py-0.5 font-mono text-[10px] text-white">{u.role}</span>}
                                            </div>
                                            <div className="truncate font-mono text-[11px] text-[#A19E97]">{u.email}{u.username ? ` · @${u.username}` : ''}</div>
                                        </td>
                                        <td className="py-2.5 pr-4 capitalize">{u.plan}</td>
                                        <td className="py-2.5 pr-4 text-right font-mono">{fmt(Number(u.links))}</td>
                                        <td className="py-2.5 pr-4 text-right font-mono">{fmt(Number(u.clicks))}</td>
                                        <td className="whitespace-nowrap py-2.5 pr-4 text-[#5F5C56]">{date(u.joined)}</td>
                                        <td className="whitespace-nowrap py-2.5 text-[#5F5C56]">{date(u.lastSignIn)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Tile>
            </div>
        </div>
    );
}
