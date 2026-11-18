import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/storage/supabaseClient';
import { getCountryName } from '../utils/constants';
import { ChangeTag, DotMeter, Label, MonoPill, ShareBars, Tile, fmt, share } from '../components/ui/bento';
import PublicCard from '../components/PublicCard';

export interface SharedAnalyticsData {
    displayName: string;
    stats: { totalClicks: number; clicksThisWeek: number; clicksLastWeek: number; clicksThisMonth: number };
    countries: { country: string; clickCount: number }[];
    cities: { city: string; country: string; clickCount: number }[];
    devices: { device: string; clickCount: number }[];
    browsers: { browser: string; clickCount: number }[];
}

/** Week-over-week change in percent, or null when there was nothing last week. */
export const weekOverWeek = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

/** /share/:shareToken — a read-only copy of someone's analytics, from a link they created (valid 30 days). */
const SharedAnalytics: React.FC = () => {
    const { shareToken } = useParams<{ shareToken: string }>();
    const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'error'>('loading');
    const [data, setData] = useState<SharedAnalyticsData | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isSupabaseConfigured() || !supabase || !shareToken) { setState('invalid'); return; }
            try {
                const { data: result, error } = await supabase.rpc('get_shared_analytics', { p_share_token: shareToken });
                if (cancelled) return;
                if (error) { setState('error'); return; }
                if (!result) { setState('invalid'); return; }
                setData(result as SharedAnalyticsData);
                setState('ready');
            } catch {
                if (!cancelled) setState('error');
            }
        })();
        return () => { cancelled = true; };
    }, [shareToken]);

    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-[#ECEBE7] p-4 sm:p-8" aria-busy="true" aria-label="Loading">
                <div className="mx-auto grid max-w-5xl animate-pulse gap-3.5">
                    <div className="h-48 rounded-3xl bg-[#18181A]" />
                    <div className="h-64 rounded-3xl bg-[#FBFAF8]" />
                </div>
            </div>
        );
    }
    if (state !== 'ready' || !data) {
        return (
            <PublicCard>
                <h1 className="text-[22px] font-medium tracking-tight">{state === 'error' ? 'Couldn\'t load these numbers' : 'This share link has expired'}</h1>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5F5C56]">
                    {state === 'error' ? 'Something went wrong. Try again in a moment.' : 'Share links work for 30 days. Ask whoever sent it for a new one.'}
                </p>
            </PublicCard>
        );
    }

    const s = data.stats;
    const total = Number(s.totalClicks);
    const week = Number(s.clicksThisWeek);
    const lastWeek = Number(s.clicksLastWeek);
    const change = weekOverWeek(week, lastWeek);
    const deviceTotal = data.devices.reduce((a, d) => a + Number(d.clickCount), 0);
    const browserTotal = data.browsers.reduce((a, d) => a + Number(d.clickCount), 0);

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-5 flex flex-wrap items-end gap-3">
                    <div>
                        <p className="mb-1 font-mono text-[12px] text-[#8C8981]">Shared analytics · read only</p>
                        <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">{data.displayName}</h1>
                    </div>
                    <a href="/" className="ml-auto flex items-center gap-2 rounded-full bg-[#FBFAF8] px-3 py-1.5 text-[12px] text-[#8C8981] hover:text-[#18181A]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#18181A]"><span className="h-1.5 w-1.5 rounded-[2px] bg-[#FF5A14]" /></span>
                        Made with Gather
                    </a>
                </div>

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    <Tile dark className="lg:col-span-7">
                        <Label dark right={change !== null && <ChangeTag change={change} />}>Clicks · last 7 days</Label>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span className="font-mono text-[clamp(56px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(week)}</span>
                            <span className="font-mono text-[15px] text-[#8E8B84]">/ {fmt(lastWeek)} the week before</span>
                        </div>
                    </Tile>
                    <Tile className="grid grid-cols-2 gap-4 lg:col-span-5">
                        <div>
                            <Label>Last 30 days</Label>
                            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(Number(s.clicksThisMonth))}</div>
                        </div>
                        <div>
                            <Label>All time</Label>
                            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(total)}</div>
                        </div>
                    </Tile>

                    <Tile className="lg:col-span-6">
                        <Label right={<MonoPill>all time</MonoPill>}>Top countries</Label>
                        {data.countries.length
                            ? <ShareBars rows={data.countries.filter(c => c.country !== 'Unknown').slice(0, 7).map(c => ({ name: getCountryName(c.country), value: Number(c.clickCount) }))} total={total} />
                            : <p className="text-[13px] text-[#8C8981]">No location data yet.</p>}
                    </Tile>
                    <Tile className="lg:col-span-6">
                        <Label right={<MonoPill>all time</MonoPill>}>Top cities</Label>
                        {data.cities.length ? (
                            <ol className="grid gap-2">
                                {data.cities.filter(c => c.city).slice(0, 7).map((c, i) => (
                                    <li key={`${c.city}-${c.country}`} className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 text-[13px]">
                                        <span className="font-mono text-[11px] text-[#A19E97]">{i + 1}</span>
                                        <span className="truncate">{c.city}<span className="text-[#A19E97]">, {getCountryName(c.country)}</span></span>
                                        <span className="font-mono">{fmt(Number(c.clickCount))}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="text-[13px] text-[#8C8981]">No city data yet.</p>}
                    </Tile>

                    <Tile className="lg:col-span-6">
                        <Label right={<MonoPill>all time</MonoPill>}>Devices</Label>
                        {data.devices.filter(d => d.device !== 'Unknown').slice(0, 3).map(d => (
                            <DotMeter key={d.device} label={d.device} percent={share(Number(d.clickCount), deviceTotal)} />
                        ))}
                        {deviceTotal === 0 && <p className="text-[13px] text-[#8C8981]">No clicks yet.</p>}
                    </Tile>
                    <Tile className="lg:col-span-6">
                        <Label right={<MonoPill>all time</MonoPill>}>Browsers</Label>
                        {data.browsers.filter(b => b.browser !== 'Unknown').slice(0, 4).map(b => (
                            <DotMeter key={b.browser} label={b.browser} percent={share(Number(b.clickCount), browserTotal)} />
                        ))}
                        {browserTotal === 0 && <p className="text-[13px] text-[#8C8981]">No clicks yet.</p>}
                    </Tile>
                </div>
            </div>
        </div>
    );
};

export default SharedAnalytics;
