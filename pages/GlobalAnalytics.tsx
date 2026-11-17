import React, { useEffect, useState } from 'react';
import { Check, Loader2, Share2 } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics, type UserAnalyticsExtras } from '../services/aggregatedAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import {
  BrowserBreakdown, CityBreakdown, CountryBreakdown, DailyClicks, DeviceBreakdown,
  DeviceModelBreakdown, OsBreakdown, ReferrerBreakdown, UserClickStats,
} from '../types';
import LiveWorldMap from '../components/LiveWorldMap';
import { getCountryName } from '../utils/constants';
import {
  Tile, Label, MonoPill, ChangeTag, DotMeter, ShareBars, DotColumns, HeatGrid, HeatLegend, SourceShare,
  DAY_NAMES, fmt, share, hourLabel, busiestHour, groupSources, sourceName, viewerZoneLabel,
} from '../components/ui/bento';

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = typeof ANALYTICS_RANGES[number];

const VIEWER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
// Clicks carry a visitor ID only from this date on.
const VISITOR_TRACKING_LABEL = 'Counted from 1 Nov 2026';

interface AnalyticsData {
  stats: UserClickStats | null;
  daily: DailyClicks[];
  extras: UserAnalyticsExtras | null;
  countries: CountryBreakdown[];
  cities: CityBreakdown[];
  devices: DeviceBreakdown[];
  oses: OsBreakdown[];
  browsers: BrowserBreakdown[];
  models: DeviceModelBreakdown[];
  referrers: ReferrerBreakdown[];
  linkCount: number;
}

/** Week-over-week change in percent, or null when there's no last week to compare with. */
export function weekChange(thisWeek: number, lastWeek: number): number | null {
  return lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
}

/** One point per UTC day for the last `days` days, today last; missing days count 0. */
export function dailyPoints(daily: DailyClicks[], days: number, now = new Date()) {
  const byDate = new Map(daily.map(d => [d.date, d.clickCount]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const label = days > 16 ? String(d.getUTCDate()) : DAY_NAMES[d.getUTCDay()].slice(0, 1);
    return { key, label, value: byDate.get(key) ?? 0 };
  });
}

const RangePills: React.FC<{ range: AnalyticsRange; isPro: boolean; onRange: (r: AnalyticsRange) => void }> = ({ range, isPro, onRange }) => (
  <div role="group" aria-label="Period" className="flex gap-1 rounded-full bg-[#FBFAF8] p-1">
    {ANALYTICS_RANGES.map(r => {
      const locked = r === 90 && !isPro;
      return (
        <button
          key={r}
          onClick={() => !locked && onRange(r)}
          disabled={locked}
          aria-pressed={range === r}
          title={locked ? 'Upgrade to Pro for 90 days of history' : undefined}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${range === r ? 'bg-[#FF5A14] text-white' : locked ? 'cursor-not-allowed text-[#C9C6BF]' : 'text-[#8C8981] hover:text-[#18181A]'}`}
        >
          {r} days{locked && <span className="ml-1.5 rounded bg-[#F0EEEA] px-1 py-px text-[9px] text-[#A19E97]">PRO</span>}
        </button>
      );
    })}
  </div>
);

const Skeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12" aria-busy="true" aria-label="Loading analytics">
    {['lg:col-span-7 h-[300px] bg-[#18181A]', 'lg:col-span-5 h-[300px]', 'lg:col-span-12 h-[420px]', 'lg:col-span-8 h-[260px]', 'lg:col-span-4 h-[260px]'].map(c => (
      <div key={c} className={`animate-pulse rounded-3xl bg-[#FBFAF8] ${c}`} />
    ))}
  </div>
);

const GlobalAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [placeTab, setPlaceTab] = useState<'countries' | 'cities'>('countries');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const tier = user?.preferences?.subscription_tier as string | undefined;
  const isPro = tier === 'pro' || tier === 'business' || tier === 'premium';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setFailed(false);
    (async () => {
      try {
        const id = user.id;
        const [stats, daily, extras, countries, cities, devices, oses, browsers, models, referrers, links] = await Promise.all([
          aggregatedAnalytics.getUserClickStats(id),
          aggregatedAnalytics.getClicksOverTime(id, range),
          aggregatedAnalytics.getUserAnalyticsExtras(range, VIEWER_TIME_ZONE),
          aggregatedAnalytics.getCountryBreakdown(id),
          aggregatedAnalytics.getCityBreakdown(id),
          aggregatedAnalytics.getDeviceBreakdown(id),
          aggregatedAnalytics.getOsBreakdown(id),
          aggregatedAnalytics.getBrowserBreakdown(id),
          aggregatedAnalytics.getDeviceModelBreakdown(id),
          aggregatedAnalytics.getReferrerBreakdown(id),
          supabaseAdapter.getLinks(null, { includeAnalytics: false }),
        ]);
        if (cancelled) return;
        // The service returns null instead of throwing when the database calls fail.
        if (!stats && !extras) { setFailed(true); return; }
        {
          setData({ stats, daily, extras, countries, cities, devices, oses, browsers, models, referrers, linkCount: links.length });
        }
      } catch (err) {
        console.error('[Analytics] load failed:', err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, range, attempt]);

  const shareAnalytics = async () => {
    if (!user?.id || sharing) return;
    setSharing(true);
    try {
      const { supabase } = await import('../services/storage/supabaseClient');
      if (!supabase) throw new Error('Supabase not configured');
      const { data: token, error } = await supabase.rpc('create_analytics_share_token', { p_expires_in_days: 30 });
      if (error) throw error;
      await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('[Analytics] share link failed:', err);
      alert('Could not create a share link. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const header = (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Analytics</h1>
        <p className="mt-1 text-[13px] text-[#8C8981]">Every link together. Open a link for its own numbers.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <RangePills range={range} isPro={isPro} onRange={r => { setRange(r); setData(null); }} />
        <button
          onClick={shareAnalytics}
          disabled={sharing}
          title="Copies a read-only link to these analytics, valid for 30 days"
          className="flex items-center gap-2 rounded-full bg-[#18181A] px-4 py-2 text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (failed) {
    body = (
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FBFAF8] px-5 py-3 text-sm text-[#B42318]">
        <span>Couldn't load your analytics.</span>
        <button onClick={() => setAttempt(n => n + 1)} className="font-semibold underline underline-offset-2">Try again</button>
      </div>
    );
  } else if (!data) {
    body = <Skeleton />;
  } else {
    const { stats, extras } = data;
    const points = dailyPoints(data.daily, range);
    const rangeTotal = points.reduce((s, p) => s + p.value, 0);
    const thisWeek = Number(extras?.thisWeek ?? stats?.clicksThisWeek ?? 0);
    const lastWeek = Number(extras?.lastWeek ?? 0);
    const change = weekChange(thisWeek, lastWeek);
    const allTime = stats?.totalClicks ?? 0;

    const heat = new Map((extras?.heatmap ?? []).map(h => [`${h.day}-${h.hour}`, Number(h.clicks)]));
    const peak = busiestHour(heat);

    const placeRows = placeTab === 'cities'
      ? data.cities.slice(0, 7).map(c => ({ name: `${c.city}, ${getCountryName(c.country)}`, value: c.clickCount }))
      : data.countries.filter(c => c.country !== 'Unknown').slice(0, 7).map(c => ({ name: getCountryName(c.country), value: c.clickCount }));
    const deviceTotal = data.devices.reduce((s, d) => s + d.clickCount, 0);
    const osTotal = data.oses.reduce((s, d) => s + d.clickCount, 0);
    const sources = groupSources(data.referrers.map(r => ({ name: r.referrer, value: r.clickCount })));
    const recent = extras?.recent ?? [];

    body = (
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Anchor: clicks in the range */}
        <Tile dark className="lg:col-span-7">
          <Label dark right={<MonoPill dark>UTC days</MonoPill>}>Clicks · last {range} days</Label>
          <span className="font-mono text-[clamp(56px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(rangeTotal)}</span>
          <div className="sm:hidden"><DotColumns points={points.slice(-14)} label="Clicks per day, last 14 days" /></div>
          <div className="hidden sm:block"><DotColumns points={points} label={`Clicks per day, last ${range} days`} /></div>
        </Tile>

        {/* Week, all time, visitors, links */}
        <Tile className="grid grid-cols-2 content-start gap-x-4 gap-y-7 lg:col-span-5">
          <div>
            <Label right={change !== null && <ChangeTag change={change} />}>This week</Label>
            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(thisWeek)}</div>
            <p className="mt-2 text-xs text-[#8C8981]">{fmt(lastWeek)} the week before</p>
          </div>
          <div>
            <Label>All time</Label>
            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(allTime)}</div>
            <p className="mt-2 text-xs text-[#8C8981]">clicks on all your links</p>
          </div>
          <div>
            <Label>Visitors</Label>
            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(stats?.uniqueVisitors ?? 0)}</div>
            <p className="mt-2 text-xs text-[#8C8981]">unique, all time. {VISITOR_TRACKING_LABEL}.</p>
          </div>
          <div>
            <Label>Links</Label>
            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(data.linkCount)}</div>
            <p className="mt-2 text-xs text-[#8C8981]">{data.linkCount > 0 ? `${fmt(allTime / data.linkCount)} clicks per link` : 'none yet'}</p>
          </div>
        </Tile>

        {/* Map */}
        <div className="lg:col-span-12">
          <LiveWorldMap
            countryCounts={extras?.countries ?? []}
            regionCounts={extras?.regions ?? []}
            serverCityData={data.cities}
            title={`Clicks by place · last ${range} days`}
          />
        </div>

        {/* When */}
        <Tile className="lg:col-span-8">
          <Label right={<HeatLegend />}>
            When people click <span className="ml-2"><MonoPill>last {range} days · {viewerZoneLabel}</MonoPill></span>
          </Label>
          <HeatGrid cells={heat} />
          {peak && (
            <p className="mt-3 text-xs text-[#8C8981]">
              Busiest hour: {DAY_NAMES[peak.day]} {hourLabel(peak.hour)} to {hourLabel((peak.hour + 1) % 24)}, {fmt(peak.n)} clicks.
            </p>
          )}
        </Tile>

        {/* Where */}
        <Tile className="lg:col-span-4">
          <Label right={
            <span className="flex items-center gap-1">
              {([['countries', 'Countries'], ['cities', 'Cities']] as const).map(([key, name]) => (
                <button key={key} onClick={() => setPlaceTab(key)} aria-pressed={placeTab === key}
                  className={`rounded-full px-2.5 py-1 text-xs ${placeTab === key ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}>{name}</button>
              ))}
              <MonoPill>all time</MonoPill>
            </span>
          }>Where they are</Label>
          {placeRows.length ? <ShareBars rows={placeRows} total={allTime} showCount={placeTab === 'cities'} /> : <p className="text-sm text-[#8C8981]">No location data yet.</p>}
        </Tile>

        {/* Latest clicks */}
        <Tile dark className="lg:col-span-8">
          <Label dark right={<MonoPill dark>newest first</MonoPill>}>Latest clicks</Label>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#8E8B84]">No clicks yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-1.5 text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] text-[#77746D]">
                    <th className="px-3 pb-1 font-medium">Time</th>
                    <th className="px-3 pb-1 font-medium">Place</th>
                    <th className="px-3 pb-1 font-medium">Device</th>
                    <th className="px-3 pb-1 font-medium">From</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c, i) => {
                    const src = sourceName(c.referrer);
                    return (
                      <tr key={`${c.timestamp}-${i}`}>
                        <td className="whitespace-nowrap rounded-l-xl bg-[#232326] px-3 py-2.5 font-mono text-[#A19E97]">
                          {new Date(c.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="bg-[#232326] px-3 py-2.5">{[c.city, c.country].filter(Boolean).join(', ') || 'Unknown'}</td>
                        <td className="whitespace-nowrap bg-[#232326] px-3 py-2.5">{c.device || 'Unknown'}{c.os ? ` · ${c.os}` : ''}</td>
                        <td className="rounded-r-xl bg-[#232326] px-3 py-2.5">
                          <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${src === 'Direct' ? 'bg-[#2A2A2D] text-[#A19E97]' : 'bg-[#2E2A28] text-[#FF9B6A]'}`}>{src}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tile>

        {/* Sources */}
        <Tile className="lg:col-span-4">
          <Label right={<MonoPill>all time</MonoPill>}>Where clicks come from</Label>
          <SourceShare sources={sources} />
        </Tile>

        {/* Devices & systems */}
        <Tile className="lg:col-span-4">
          <Label right={<MonoPill>all time</MonoPill>}>Devices &amp; systems</Label>
          {data.devices.filter(d => d.device !== 'Unknown').slice(0, 3).map(d => (
            <DotMeter key={d.device} label={d.device} percent={share(d.clickCount, deviceTotal)} />
          ))}
          <div className="h-2" />
          {data.oses.filter(o => o.os !== 'Unknown').slice(0, 3).map(o => (
            <DotMeter key={o.os} label={o.os} percent={share(o.clickCount, osTotal)} />
          ))}
          {deviceTotal === 0 && <p className="text-sm text-[#8C8981]">No clicks yet.</p>}
        </Tile>

        {/* Browsers and phones */}
        <Tile className="lg:col-span-8">
          <Label right={<MonoPill>all time</MonoPill>}>Browsers and phones</Label>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {[
              { title: 'Browsers', rows: data.browsers.slice(0, 6).map(b => ({ name: b.browser, value: b.clickCount })) },
              { title: 'Phone models', rows: data.models.slice(0, 6).map(m => ({ name: m.deviceModel.replace(' (Other)', ''), value: m.clickCount })) },
            ].map(group => (
              <div key={group.title}>
                <h4 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-[#8C8981]">{group.title}</h4>
                <div className="grid gap-2">
                  {group.rows.map(r => (
                    <div key={r.name} className="flex justify-between text-[13px]">
                      <span className="truncate pr-3">{r.name === 'Unknown' ? 'Not recorded' : r.name}</span>
                      <span className="font-mono text-[#8C8981]">{fmt(r.value)}</span>
                    </div>
                  ))}
                  {group.rows.length === 0 && <p className="text-xs text-[#8C8981]">No data</p>}
                </div>
              </div>
            ))}
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
      <div className="mx-auto max-w-7xl">
        {header}
        {body}
      </div>
    </div>
  );
};

export default GlobalAnalytics;
