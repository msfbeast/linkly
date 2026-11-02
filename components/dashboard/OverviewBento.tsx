import React, { useEffect, useState } from 'react';
import { aggregatedAnalytics, type TopLink, type UserAnalyticsExtras } from '../../services/aggregatedAnalyticsService';
import type { CountryBreakdown, DailyClicks, DeviceBreakdown, DeviceModelBreakdown, ReferrerBreakdown } from '../../types';

/**
 * Dashboard overview: one bento grid of the account's clicks, drawn from the
 * server-side totals (click rollups). Light neutral tiles, one charcoal
 * anchor, orange as the only accent, monospaced numerals.
 */

interface OverviewBentoProps {
    userId: string;
    /** '7d' | '30d' | '90d' (others fall back to 30 days): the heatmap and top links follow it. */
    dateRange: string;
    linkCount: number;
}

interface OverviewData {
    allTime: number;
    daily: DailyClicks[];
    extras: UserAnalyticsExtras | null;
    devices: DeviceBreakdown[];
    referrers: ReferrerBreakdown[];
    countries: CountryBreakdown[];
    models: DeviceModelBreakdown[];
    topLinks: TopLink[];
}

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEWER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const ACCENT = '#FF5A14';
const SOURCE_SHADES = [ACCENT, '#18181A', '#FF9B6A', '#B9B5AD', '#FFD3BE', '#D9D6D0'];

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
const share = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);
const pctLabel = (p: number) => (p >= 1 || p === 0 ? `${Math.round(p)}%` : `${p.toFixed(1)}%`);
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
const tzShort = (() => {
    try {
        return new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(new Date())
            .find(p => p.type === 'timeZoneName')?.value ?? VIEWER_TZ;
    } catch { return VIEWER_TZ; }
})();

// ---- small building blocks ---------------------------------------------

const Tile: React.FC<{ className?: string; dark?: boolean; children: React.ReactNode }> = ({ className = '', dark, children }) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 ${dark ? 'bg-[#18181A] text-[#F2F1EE]' : 'bg-[#FBFAF8] text-[#18181A]'} ${className}`}>
        {children}
    </div>
);

const Label: React.FC<{ dark?: boolean; children: React.ReactNode; right?: React.ReactNode }> = ({ dark, children, right }) => (
    <div className={`mb-4 flex items-center gap-2 text-[13px] ${dark ? 'text-[#A19E97]' : 'text-[#8C8981]'}`}>
        <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]" />
        <span>{children}</span>
        {right && <span className="ml-auto">{right}</span>}
    </div>
);

const MonoPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="rounded-full bg-[#F0EEEA] px-2.5 py-1 font-mono text-[11px] text-[#8C8981]">{children}</span>
);

/** A row of 25 dots, the first `percent / 4` filled. */
const DotMeter: React.FC<{ label: string; percent: number }> = ({ label, percent }) => {
    const on = Math.round(percent / 4);
    return (
        <div className="mb-4 last:mb-0">
            <div className="mb-1.5 flex justify-between text-[13px]">
                <span>{label}</span>
                <span className="font-mono">{pctLabel(percent)}</span>
            </div>
            <div className="grid max-w-[300px] grid-cols-[repeat(25,minmax(0,1fr))] gap-[3px]">
                {Array.from({ length: 25 }, (_, i) => (
                    <i key={i} className={`aspect-square rounded-full ${i < on ? 'bg-[#FF5A14]' : 'bg-[#ECEAE6]'}`} />
                ))}
            </div>
        </div>
    );
};

const Sparkline: React.FC<{ values: number[]; highlight: boolean }> = ({ values, highlight }) => {
    const max = Math.max(...values, 1);
    const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 116 + 2},${26 - (v / max) * 22}`).join(' ');
    return (
        <svg viewBox="0 0 120 28" className="hidden h-7 w-[120px] sm:block" aria-hidden>
            <polyline points={points} fill="none" stroke={highlight ? ACCENT : '#8E8B84'} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
    );
};

const Skeleton: React.FC = () => (
    <div className="grid grid-cols-12 gap-3.5" aria-busy="true" aria-label="Loading overview">
        {[6, 3, 3, 8, 4, 8, 4].map((span, i) => (
            <div key={i} style={{ gridColumn: `span ${span}` }} className={`h-56 animate-pulse rounded-3xl ${i === 0 || i === 5 ? 'bg-[#232326]' : 'bg-[#F3F2EF]'}`} />
        ))}
    </div>
);

// ---- the overview ---------------------------------------------------------

const OverviewBento: React.FC<OverviewBentoProps> = ({ userId, dateRange, linkCount }) => {
    const rangeDays = RANGE_DAYS[dateRange] ?? 30;
    const [data, setData] = useState<OverviewData | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let current = true;
        setFailed(false);
        Promise.all([
            aggregatedAnalytics.getUserClickStats(userId),
            aggregatedAnalytics.getClicksOverTime(userId, 14),
            aggregatedAnalytics.getUserAnalyticsExtras(rangeDays, VIEWER_TZ),
            aggregatedAnalytics.getDeviceBreakdown(userId),
            aggregatedAnalytics.getReferrerBreakdown(userId),
            aggregatedAnalytics.getCountryBreakdown(userId),
            aggregatedAnalytics.getDeviceModelBreakdown(userId),
            aggregatedAnalytics.getTopLinks(rangeDays),
        ]).then(([stats, daily, extras, devices, referrers, countries, models, topLinks]) => {
            if (!current) return;
            if (!stats && !extras) { setFailed(true); return; }
            setData({ allTime: stats?.totalClicks ?? 0, daily, extras, devices, referrers, countries, models, topLinks });
        }).catch(() => current && setFailed(true));
        return () => { current = false; };
    }, [userId, rangeDays, attempt]);

    if (failed) {
        return (
            <div className="flex items-center justify-between rounded-3xl bg-[#FBFAF8] px-6 py-5 text-sm text-[#8C8981]">
                <span>Couldn't load your click overview.</span>
                <button onClick={() => setAttempt(n => n + 1)} className="font-medium text-[#18181A] underline underline-offset-2">Try again</button>
            </div>
        );
    }
    if (!data) return <Skeleton />;

    const thisWeek = Number(data.extras?.thisWeek ?? 0);
    const lastWeek = Number(data.extras?.lastWeek ?? 0);
    const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

    // 14 days of daily clicks (UTC dates), today last.
    const byDate = new Map(data.daily.map(d => [d.date, d.clickCount]));
    const days14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        return { key, day: DAYS[d.getUTCDay()][0], n: byDate.get(key) ?? 0 };
    });
    const maxDay = Math.max(...days14.map(d => d.n), 1);

    const deviceTotal = data.devices.reduce((s, d) => s + d.clickCount, 0);
    const refTotal = data.referrers.reduce((s, d) => s + d.clickCount, 0);
    const modelTotal = data.models.reduce((s, d) => s + d.clickCount, 0);
    const topRef = data.referrers[0];

    const heat = new Map((data.extras?.heatmap ?? []).map(h => [`${h.day}-${h.hour}`, Number(h.clicks)]));
    const maxHeat = Math.max(...heat.values(), 1);
    let peak = { n: 0, day: 0, hour: 0 };
    heat.forEach((n, k) => { if (n > peak.n) { const [day, hour] = k.split('-').map(Number); peak = { n, day, hour }; } });
    const heatColor = (n: number) => {
        const r = n / maxHeat;
        return r > 0.75 ? 'bg-[#FF5A14]' : r > 0.5 ? 'bg-[#FF9B6A]' : r > 0.28 ? 'bg-[#FFD3BE]' : 'bg-[#ECEAE6]';
    };

    const host = typeof window !== 'undefined' ? window.location.host : 'links.trak.in';

    return (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
            {/* Anchor: this week */}
            <Tile dark className="lg:col-span-6">
                <Label dark right={change !== null && (
                    <span className="rounded-md bg-[#2E2A28] px-2 py-0.5 font-mono text-[11px] text-[#FF9B6A]">
                        {change < 0 ? '↘' : '↗'} {Math.abs(change)}%
                    </span>
                )}>Clicks this week</Label>
                <div className="flex flex-wrap items-baseline gap-x-4">
                    <span className="font-mono text-[clamp(56px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(thisWeek)}</span>
                    <span className="font-mono text-[15px] text-[#8E8B84]">/ {fmt(lastWeek)} last week</span>
                </div>
                <div className="mt-5 flex h-[130px] items-end gap-2.5" role="img" aria-label="Clicks per day, last 14 days">
                    {days14.map((d, i) => (
                        <div key={d.key} title={`${d.key}: ${fmt(d.n)}`} className="flex flex-1 flex-col-reverse items-center gap-1">
                            {Array.from({ length: Math.max(1, Math.round((d.n / maxDay) * 12)) }, (_, j) => (
                                <i key={j} className={`h-2 w-2 rounded-full ${i === 13 ? 'bg-[#FF5A14]' : i >= 7 ? 'bg-[#6E6B65]' : 'bg-[#3A3936]'}`} />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex gap-2.5">
                    {days14.map(d => <span key={d.key} className="flex-1 text-center font-mono text-[10px] text-[#6E6B65]">{d.day}</span>)}
                </div>
            </Tile>

            {/* All time + devices */}
            <Tile className="flex flex-col lg:col-span-3">
                <Label>All-time clicks</Label>
                <span className="font-mono text-[clamp(32px,3vw,44px)] font-medium leading-none tracking-[-0.04em]">{fmt(data.allTime)}</span>
                <span className="mt-2 font-mono text-[15px] text-[#8C8981]">across {fmt(linkCount)} links</span>
                <div className="flex-1" />
                <div className="mt-6">
                    <Label right={<MonoPill>all time</MonoPill>}>Devices</Label>
                    {data.devices.filter(d => d.device && d.device !== 'Unknown' && d.device !== 'unknown').slice(0, 3).map(d => (
                        <DotMeter key={d.device} label={d.device.charAt(0).toUpperCase() + d.device.slice(1)} percent={share(d.clickCount, deviceTotal)} />
                    ))}
                </div>
            </Tile>

            {/* Sources */}
            <Tile className="lg:col-span-3">
                <Label right={<MonoPill>all time</MonoPill>}>Where clicks come from</Label>
                {topRef ? (
                    <>
                        <div className="flex items-baseline gap-2.5">
                            <span className="font-mono text-[56px] font-medium leading-none tracking-[-0.04em]">{pctLabel(share(topRef.clickCount, refTotal))}</span>
                            <span className="font-mono text-[15px] text-[#8C8981]">from {topRef.referrer}</span>
                        </div>
                        <div className="my-4 flex h-2.5 gap-[3px] overflow-hidden rounded-full">
                            {data.referrers.slice(0, 6).map((r, i) => (
                                <i key={r.referrer} style={{ flex: r.clickCount, background: SOURCE_SHADES[i], minWidth: 4 }} />
                            ))}
                        </div>
                        <div className="grid gap-2">
                            {data.referrers.slice(0, 6).map((r, i) => (
                                <div key={r.referrer} className="flex justify-between text-[13px]">
                                    <span className="flex items-center"><i className="mr-2 inline-block h-2 w-2 rounded-[2px]" style={{ background: SOURCE_SHADES[i] }} />{r.referrer}</span>
                                    <span className="font-mono text-[#8C8981]">{fmt(r.clickCount)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : <p className="text-sm text-[#8C8981]">No clicks yet.</p>}
            </Tile>

            {/* Heatmap */}
            <Tile className="lg:col-span-8">
                <Label right={
                    <span className="flex items-center gap-1.5 text-[11px]">fewer
                        {['bg-[#ECEAE6]', 'bg-[#FFD3BE]', 'bg-[#FF9B6A]', 'bg-[#FF5A14]'].map(c => <i key={c} className={`inline-block h-2.5 w-3.5 rounded-[3px] ${c}`} />)}
                        more</span>
                }>
                    When your audience clicks <span className="ml-2"><MonoPill>last {rangeDays} days · {tzShort}</MonoPill></span>
                </Label>
                <div className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                        <React.Fragment key={day}>
                            <span className="flex items-center text-[11px] text-[#8C8981]">{DAYS[day]}</span>
                            {Array.from({ length: 24 }, (_, hour) => {
                                const n = heat.get(`${day}-${hour}`) ?? 0;
                                return <i key={hour} title={`${DAYS[day]} ${hourLabel(hour)}: ${fmt(n)} clicks`} className={`aspect-[1.5] rounded-[5px] ${heatColor(n)}`} />;
                            })}
                        </React.Fragment>
                    ))}
                    <span />
                    {Array.from({ length: 24 }, (_, h) => (
                        <span key={h} className="text-center font-mono text-[9px] text-[#8C8981]">{h % 3 === 0 ? hourLabel(h).replace('m', '') : ''}</span>
                    ))}
                </div>
                {peak.n > 0 && (
                    <p className="mt-3 text-xs text-[#8C8981]">
                        Busiest hour: {DAYS[peak.day]} {hourLabel(peak.hour)} to {hourLabel((peak.hour + 1) % 24)}, {fmt(peak.n)} clicks in the last {rangeDays} days.
                    </p>
                )}
            </Tile>

            {/* Countries */}
            <Tile className="lg:col-span-4">
                <Label right={<MonoPill>all time</MonoPill>}>Top countries</Label>
                <div className="grid gap-3">
                    {data.countries.slice(0, 6).map(c => {
                        const p = share(c.clickCount, data.allTime);
                        return (
                            <div key={c.country}>
                                <div className="mb-1.5 flex justify-between text-[13px]"><span>{c.country}</span><span className="font-mono text-[#8C8981]">{pctLabel(p)}</span></div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#ECEAE6]"><i className="block h-full rounded-full bg-[#FF5A14]" style={{ width: `${Math.max(p, 1.2)}%` }} /></div>
                            </div>
                        );
                    })}
                </div>
            </Tile>

            {/* Top links */}
            <Tile dark className="lg:col-span-8">
                <Label dark right={<span className="text-xs">clicks in the last {rangeDays} days · trend over {data.topLinks[0]?.spark.length ?? 13} full days</span>}>
                    Top links
                </Label>
                <div className="grid gap-2">
                    {data.topLinks.length === 0 && <p className="text-sm text-[#8E8B84]">No clicks in this period.</p>}
                    {data.topLinks.map((l, i) => {
                        const unnamed = !l.title || l.title === 'New Link';
                        return (
                            <a key={l.id} href={`/analytics/${l.id}`} className="grid grid-cols-[22px_1fr_auto] items-center gap-3 rounded-2xl bg-[#232326] px-4 py-3 transition-colors hover:bg-[#2B2B2F] sm:grid-cols-[26px_1fr_120px_80px] sm:gap-3.5">
                                <span className="font-mono text-[11px] text-[#77746D]">0{i + 1}</span>
                                <div className="min-w-0">
                                    <div className="truncate text-sm">
                                        {unnamed ? `/${l.shortCode}` : l.title}
                                        {unnamed && <span className="ml-1.5 rounded bg-[#2E2A28] px-1.5 py-0.5 font-mono text-[10px] text-[#FF9B6A]">add a title</span>}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[11px] text-[#8E8B84]">{host}/{l.shortCode}</div>
                                </div>
                                <Sparkline values={l.spark} highlight={i === 0} />
                                <span className="text-right font-mono text-lg">{fmt(l.clicks)}</span>
                            </a>
                        );
                    })}
                </div>
            </Tile>

            {/* Models */}
            <Tile className="lg:col-span-4">
                <Label right={<MonoPill>all time</MonoPill>}>What they click from</Label>
                {data.models.slice(0, 5).map(m => (
                    <DotMeter key={m.deviceModel} label={m.deviceModel.replace(' (Other)', '')} percent={share(m.clickCount, modelTotal)} />
                ))}
            </Tile>
        </div>
    );
};

export default OverviewBento;
