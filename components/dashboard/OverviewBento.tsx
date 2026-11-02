import React, { useEffect, useState } from 'react';
import { aggregatedAnalytics, type TopLink, type UserAnalyticsExtras } from '../../services/aggregatedAnalyticsService';
import type { CountryBreakdown, DailyClicks, DeviceBreakdown, DeviceModelBreakdown, ReferrerBreakdown } from '../../types';
import {
    Tile, Label, MonoPill, ChangeTag, DotMeter, ShareBars, Sparkline, DotColumns, HeatGrid, HeatLegend, SourceShare,
    DAY_NAMES as DAYS, fmt, share, hourLabel, busiestHour, viewerZoneLabel as tzShort,
} from '../ui/bento';

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
const VIEWER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

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
        return { key, label: DAYS[d.getUTCDay()][0], value: byDate.get(key) ?? 0 };
    });

    const deviceTotal = data.devices.reduce((s, d) => s + d.clickCount, 0);
    const modelTotal = data.models.reduce((s, d) => s + d.clickCount, 0);

    const heat = new Map((data.extras?.heatmap ?? []).map(h => [`${h.day}-${h.hour}`, Number(h.clicks)]));
    const peak = busiestHour(heat);

    const host = typeof window !== 'undefined' ? window.location.host : 'links.trak.in';

    return (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
            {/* Anchor: this week */}
            <Tile dark className="lg:col-span-6">
                <Label dark right={change !== null && <ChangeTag change={change} />}>Clicks this week</Label>
                <div className="flex flex-wrap items-baseline gap-x-4">
                    <span className="font-mono text-[clamp(56px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(thisWeek)}</span>
                    <span className="font-mono text-[15px] text-[#8E8B84]">/ {fmt(lastWeek)} last week</span>
                </div>
                <DotColumns points={days14} label="Clicks per day, last 14 days" />
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
                <SourceShare sources={data.referrers.map(r => ({ name: r.referrer, value: r.clickCount }))} />
            </Tile>

            {/* Heatmap */}
            <Tile className="lg:col-span-8">
                <Label right={<HeatLegend />}>
                    When your audience clicks <span className="ml-2"><MonoPill>last {rangeDays} days · {tzShort}</MonoPill></span>
                </Label>
                <HeatGrid cells={heat} />
                {peak && (
                    <p className="mt-3 text-xs text-[#8C8981]">
                        Busiest hour: {DAYS[peak.day]} {hourLabel(peak.hour)} to {hourLabel((peak.hour + 1) % 24)}, {fmt(peak.n)} clicks in the last {rangeDays} days.
                    </p>
                )}
            </Tile>

            {/* Countries */}
            <Tile className="lg:col-span-4">
                <Label right={<MonoPill>all time</MonoPill>}>Top countries</Label>
                <ShareBars rows={data.countries.slice(0, 6).map(c => ({ name: c.country, value: c.clickCount }))} total={data.allTime} />
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
