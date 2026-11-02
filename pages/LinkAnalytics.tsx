import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Download } from 'lucide-react';
import { LinkData, ClickEvent, getCategoryColor, LinkAnalytics as LinkAnalyticsData, LinkAnalyticsRange } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics } from '../services/aggregatedAnalyticsService';
import {
    Tile, Label, MonoPill, ChangeTag, DotMeter, ShareBars, DotColumns, HeatGrid, HeatLegend, SourceShare,
    DAY_NAMES, fmt, share, pctLabel, hourLabel, busiestHour, groupSources, sourceName, viewerZoneLabel,
} from '../components/ui/bento';

const ITEMS_PER_PAGE = 10;
const RANGE_MS: Record<LinkAnalyticsRange, number | null> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    all: null,
};
const VIEWER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** Earliest click time in the range, or null for all time. */
const rangeStart = (range: LinkAnalyticsRange, now: number) => {
    const span = RANGE_MS[range];
    return span === null ? null : now - span;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
// Same keys get_link_analytics returns for its timeline, in local time.
const dayKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const hourKey = (d: Date) => `${dayKey(d)}T${pad2(d.getHours())}`;

const PERIOD_LABEL: Record<LinkAnalyticsRange, string> = { '24h': '24h', '7d': '7 days', '30d': '30 days', all: '' };

// Clicks only carry a visitor ID from this moment on; unique counts for
// anything earlier are partial.
const VISITOR_TRACKING_START = Date.parse('2026-11-01T08:17:00Z');
const VISITOR_TRACKING_LABEL = 'Counted from 1 Nov 2026';

const EMPTY_ANALYTICS: LinkAnalyticsData = {
    range: '7d', timezone: 'UTC', total: 0, unique: 0, previousTotal: 0, previousUnique: 0,
    timeline: [], devices: [], browsers: [], oses: [], countries: [], referrers: [], deviceModels: [],
    screenWidths: [], languages: [], timezones: [], regions: [], cities: [], heatmap: [], destinations: [],
};

const LinkAnalytics: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [link, setLink] = useState<LinkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [timeRange, setTimeRange] = useState<LinkAnalyticsRange>('7d');
    const [currentPage, setCurrentPage] = useState(1);
    // Counts for the selected range, from get_link_analytics (null while loading).
    const [analytics, setAnalytics] = useState<LinkAnalyticsData | null>(null);
    const [analyticsError, setAnalyticsError] = useState(false);
    const [analyticsAttempt, setAnalyticsAttempt] = useState(0);
    // The one page of clicks the table shows.
    const [pageClicks, setPageClicks] = useState<ClickEvent[]>([]);
    const [exporting, setExporting] = useState(false);
    const [placeTab, setPlaceTab] = useState<'states' | 'cities' | 'world'>('states');

    useEffect(() => {
        const fetchLink = async () => {
            if (!id) return;
            try {
                // Fetch link data first
                const data = await supabaseAdapter.getLink(id);

                if (data) {
                    setLink(data);
                    setLoading(false);
                } else {
                    // Handle not found
                    navigate('/links');
                }
            } catch (error) {
                console.error('Failed to load link:', error);
                setLoading(false);
            }
        };
        fetchLink();
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        let current = true;
        setAnalytics(null);
        setAnalyticsError(false);
        aggregatedAnalytics.getLinkAnalytics(id, timeRange, VIEWER_TIME_ZONE)
            .then(data => { if (current) setAnalytics(data); })
            .catch(err => {
                console.error('[LinkAnalytics] Failed to load analytics:', err);
                if (current) setAnalyticsError(true);
            });
        return () => { current = false; };
    }, [id, timeRange, analyticsAttempt]);

    useEffect(() => {
        if (!id) return;
        let current = true;
        aggregatedAnalytics.getLinkClicksPage(id, rangeStart(timeRange, Date.now()), (currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE)
            .then(rows => { if (current) setPageClicks(rows); })
            .catch(err => {
                console.error('[LinkAnalytics] Failed to load clicks:', err);
                if (current) setPageClicks([]);
            });
        return () => { current = false; };
    }, [id, timeRange, currentPage]);

    const handleCopy = () => {
        if (!link) return;
        const url = `${window.location.origin}/r/${link.shortCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#ECEBE7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#FF5A14] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!link) return null;

    // --- Data (counted on the server for the selected range) ---
    const stats = analytics ?? EMPTY_ANALYTICS;
    const now = Date.now();
    const total = stats.total;

    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const clickGrowth = calculateGrowth(total, stats.previousTotal);
    const uniqueClicks = stats.unique;
    const uniqueGrowth = calculateGrowth(uniqueClicks, stats.previousUnique);
    // The current or previous period reaches back before visitor IDs existed.
    const comparedFrom = timeRange === 'all' ? null : now - 2 * (RANGE_MS[timeRange] as number);
    const uniqueNote = comparedFrom === null || comparedFrom < VISITOR_TRACKING_START ? VISITOR_TRACKING_LABEL : null;

    // Export to CSV: fetches the range's clicks only when asked.
    const handleExportCSV = async () => {
        if (!id || exporting) return;
        setExporting(true);
        try {
            const clicks = await aggregatedAnalytics.getAllLinkClicks(id, rangeStart(timeRange, Date.now()));
            const headers = ['Timestamp', 'Country', 'City', 'Device', 'OS', 'Browser', 'Referrer', 'Visitor ID'];
            const rows = clicks.map(c => [
                new Date(c.timestamp).toISOString(),
                c.country || '',
                c.city || '',
                c.device || '',
                c.os || '',
                c.browser || '',
                c.referrer || '',
                c.visitorId || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `gather_analytics_${id}_${timeRange}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[LinkAnalytics] CSV export failed:', err);
            alert('Could not export the clicks. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // 1. Timeline: 24 hourly points, or one point per day (last 14 days for All Time)
    const counts = new Map(stats.timeline.map(p => [p.key, p.clicks]));
    const dayCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    const timeline: { key: string; label: string; value: number; sub?: string }[] = timeRange === '24h'
        ? Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now - (23 - i) * 60 * 60 * 1000);
            return { key: hourKey(d), label: hourLabel(d.getHours()).replace('m', ''), value: counts.get(hourKey(d)) ?? 0 };
        })
        : Array.from({ length: dayCount }, (_, i) => {
            const d = new Date(now - (dayCount - 1 - i) * 24 * 60 * 60 * 1000);
            const v = counts.get(dayKey(d)) ?? 0;
            return { key: dayKey(d), label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: v, sub: fmt(v) };
        });

    const itemsPerPage = ITEMS_PER_PAGE;
    const totalPages = Math.ceil(total / itemsPerPage);

    const sources = groupSources(stats.referrers);
    const heat = new Map(stats.heatmap.map(h => [`${h.day}-${h.hour}`, h.count]));
    const peak = busiestHour(heat);
    const heatTotal = [...heat.values()].reduce((a, n) => a + n, 0);
    const evening = [...heat.entries()].filter(([k]) => Number(k.split('-')[1]) >= 16).reduce((a, [, n]) => a + n, 0);

    const india = stats.countries.find(c => c.name === 'India');
    const indianStates = stats.regions.filter(r => r.country === 'India').map(r => ({ name: r.region, value: r.value }));
    const tab = placeTab === 'states' && indianStates.length === 0 ? 'world' : placeTab;
    const placeRows = tab === 'states' ? indianStates.slice(0, 7)
        : tab === 'cities' ? stats.cities.map(c => ({ name: c.city, value: c.value })).slice(0, 7)
        : stats.countries.filter(c => c.name !== 'Unknown').slice(0, 7);
    const placeTotal = tab === 'states' ? (india?.value ?? total) : total;

    const deviceTotal = stats.devices.reduce((a, d) => a + d.value, 0);
    const osTotal = stats.oses.reduce((a, d) => a + d.value, 0);
    const rangeLabel = timeRange === 'all' ? 'All time' : `Last ${PERIOD_LABEL[timeRange]}`;

    // 2. A/B test split
    const abTestData = (() => {
        if (!link.abTestConfig?.enabled) return null;
        const clickCounts: Record<string, number> = {};
        stats.destinations.forEach(d => { clickCounts[d.url] = d.clicks; });
        return link.abTestConfig.variants.map(v => ({
            ...v,
            clicks: clickCounts[v.url] || 0,
            percentage: total > 0 ? ((clickCounts[v.url] || 0) / total) * 100 : 0,
        }));
    })();

    const destinationHost = (() => { try { return new URL(link.originalUrl).host.replace(/^www\./, ''); } catch { return link.originalUrl; } })();
    const shortHost = typeof window !== 'undefined' ? window.location.host : 'links.trak.in';

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 sm:p-8 text-[#18181A]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <button onClick={() => navigate('/links')} className="mb-3 flex items-center text-[13px] text-[#8C8981] transition-colors hover:text-[#18181A]">
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Links
                </button>
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="min-w-0">
                        <h1 className="truncate text-[28px] font-medium tracking-tight sm:text-[32px]">{link.title || `/${link.shortCode}`}</h1>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            <button onClick={handleCopy} className="flex items-center gap-2 rounded-full bg-[#18181A] px-3 py-1.5 font-mono text-xs text-white">
                                {shortHost}/{link.shortCode} {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <a href={link.originalUrl} target="_blank" rel="noreferrer" className="flex max-w-[280px] items-center gap-1.5 truncate rounded-full bg-[#FBFAF8] px-3 py-1.5 font-mono text-xs text-[#8C8981] hover:text-[#18181A]">
                                → <span className="truncate text-[#18181A]">{destinationHost}</span>
                            </a>
                            <span className="rounded-full bg-[#FBFAF8] px-3 py-1.5 font-mono text-xs text-[#8C8981]">
                                created <span className="text-[#18181A]">{new Date(link.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                        <div className="flex gap-1 rounded-full bg-[#FBFAF8] p-1">
                            {(['24h', '7d', '30d', 'all'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => { setTimeRange(range); setCurrentPage(1); }}
                                    className={`whitespace-nowrap rounded-full px-2.5 py-1.5 font-mono text-xs transition-colors sm:px-3 ${timeRange === range ? 'bg-[#FF5A14] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}
                                >
                                    {range === 'all' ? 'All Time' : range === '24h' ? '24h' : <><span className="hidden sm:inline">Last </span>{range.replace('d', ' Days')}</>}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="flex items-center gap-2 rounded-full bg-[#FBFAF8] px-4 py-2 text-[13px] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? 'Exporting…' : 'Export CSV'}
                        </button>
                    </div>
                </div>

                {(analyticsError || !analytics) && (
                    <div className="mb-4">
                        {analyticsError ? (
                            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FBFAF8] px-5 py-3 text-sm text-[#B42318]">
                                <span>Couldn't load analytics for this range.</span>
                                <button onClick={() => setAnalyticsAttempt(n => n + 1)} className="font-semibold underline underline-offset-2">Try again</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-[#8C8981]">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF5A14] border-t-transparent" />
                                Loading analytics…
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    {/* Anchor: clicks in the range */}
                    <Tile dark className="lg:col-span-7">
                        <Label dark right={timeRange !== 'all' && <ChangeTag change={clickGrowth} />}>Clicks · {rangeLabel.toLowerCase()}</Label>
                        <div className="flex flex-wrap items-baseline gap-x-4">
                            <span className="font-mono text-[clamp(56px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.04em]">{fmt(total)}</span>
                            {timeRange !== 'all' && <span className="font-mono text-[15px] text-[#8E8B84]">/ {fmt(stats.previousTotal)} previous {PERIOD_LABEL[timeRange]}</span>}
                        </div>
                        <DotColumns points={timeline} label={timeRange === '24h' ? 'Clicks per hour' : 'Clicks per day'} />
                    </Tile>

                    {/* All time + visitors */}
                    <Tile className="flex flex-col gap-6 lg:col-span-2">
                        <div>
                            <Label>All time</Label>
                            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(link.clicks)}</div>
                            <p className="mt-2 text-xs text-[#8C8981]">clicks since {new Date(link.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <Label>Visitors</Label>
                            <div className="font-mono text-4xl font-medium leading-none tracking-[-0.04em]">{fmt(uniqueClicks)}</div>
                            <p className="mt-2 text-xs leading-relaxed text-[#8C8981]">
                                unique, {rangeLabel.toLowerCase()}.{uniqueNote ? ` ${uniqueNote}.` : ''}
                            </p>
                        </div>
                    </Tile>

                    {/* Sources */}
                    <Tile className="lg:col-span-3">
                        <Label>Where clicks come from</Label>
                        <SourceShare sources={sources} />
                    </Tile>

                    {/* A/B test */}
                    {abTestData && (
                        <Tile className="lg:col-span-12">
                            <Label right={<MonoPill>A/B test</MonoPill>}>How the split is going</Label>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {abTestData.map((v, i) => (
                                    <div key={v.id ?? v.url} className="rounded-2xl bg-[#F3F2EF] p-4">
                                        <div className="mb-1 font-mono text-[11px] text-[#8C8981]">Variant {String.fromCharCode(65 + i)} · {v.weight}% of traffic</div>
                                        <div className="truncate text-sm" title={v.url}>{v.url}</div>
                                        <div className="mt-3 flex items-baseline gap-2">
                                            <span className="font-mono text-2xl">{fmt(v.clicks)}</span>
                                            <span className="font-mono text-xs text-[#8C8981]">{pctLabel(v.percentage)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Tile>
                    )}

                    {/* When */}
                    <Tile className="lg:col-span-8">
                        <Label right={<HeatLegend />}>
                            When people click <span className="ml-2"><MonoPill>{rangeLabel.toLowerCase()} · {viewerZoneLabel}</MonoPill></span>
                        </Label>
                        <HeatGrid cells={heat} />
                        {peak && (
                            <p className="mt-3 text-xs text-[#8C8981]">
                                Busiest: {DAY_NAMES[peak.day]} {hourLabel(peak.hour)} to {hourLabel((peak.hour + 1) % 24)} ({fmt(peak.n)} clicks). {pctLabel(share(evening, heatTotal))} of clicks land between 4pm and midnight.
                            </p>
                        )}
                    </Tile>

                    {/* Where */}
                    <Tile className="lg:col-span-4">
                        <Label right={
                            <span className="flex gap-1">
                                {([['states', 'India'], ['cities', 'Cities'], ['world', 'World']] as const).map(([key, name]) => (
                                    <button key={key} onClick={() => setPlaceTab(key)} className={`rounded-full px-2.5 py-1 text-xs ${tab === key ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}>{name}</button>
                                ))}
                            </span>
                        }>Where they are</Label>
                        {placeRows.length ? <ShareBars rows={placeRows} total={placeTotal} showCount={tab !== 'world'} /> : <p className="text-sm text-[#8C8981]">No location data yet.</p>}
                        {india && (
                            <p className="mt-4 text-xs text-[#8C8981]">
                                India {pctLabel(share(india.value, total))} of clicks · {indianStates.length} states and regions{stats.cities[0] ? ` · top city ${stats.cities[0].city}` : ''}
                            </p>
                        )}
                    </Tile>

                    {/* Latest clicks */}
                    <Tile dark className="lg:col-span-8">
                        <Label dark right={<MonoPill dark>newest first</MonoPill>}>Latest clicks</Label>
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
                                    {pageClicks.map((click, idx) => {
                                        const src = sourceName(click.referrer);
                                        return (
                                            <tr key={idx}>
                                                <td className="rounded-l-xl bg-[#232326] px-3 py-2.5 font-mono text-[#A19E97] whitespace-nowrap">
                                                    {new Date(click.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="bg-[#232326] px-3 py-2.5">{[click.city, click.country].filter(Boolean).join(', ') || 'Unknown'}</td>
                                                <td className="bg-[#232326] px-3 py-2.5 whitespace-nowrap">{click.device || 'Unknown'}{click.os ? ` · ${click.os}` : ''}</td>
                                                <td className="rounded-r-xl bg-[#232326] px-3 py-2.5">
                                                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${src === 'Direct' ? 'bg-[#2A2A2D] text-[#A19E97]' : 'bg-[#2E2A28] text-[#FF9B6A]'}`}>{src}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {total === 0 && <p className="py-6 text-center text-sm text-[#8E8B84]">No clicks in this period.</p>}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#8E8B84]">
                            <span>Showing {pageClicks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, total)} of {total.toLocaleString()}</span>
                            {totalPages > 1 && (
                                <span className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-full px-3 py-1 hover:bg-[#2A2A2D] disabled:opacity-40">Prev</button>
                                    <span className="font-mono">{currentPage} / {totalPages.toLocaleString()}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-full px-3 py-1 hover:bg-[#2A2A2D] disabled:opacity-40">Next</button>
                                </span>
                            )}
                        </div>
                    </Tile>

                    {/* Devices & systems */}
                    <Tile className="lg:col-span-4">
                        <Label>Devices &amp; systems</Label>
                        {stats.devices.filter(d => d.name !== 'Unknown').slice(0, 2).map(d => (
                            <DotMeter key={d.name} label={d.name} percent={share(d.value, deviceTotal)} />
                        ))}
                        <div className="h-2" />
                        {stats.oses.filter(o => o.name !== 'Unknown').slice(0, 3).map(o => (
                            <DotMeter key={o.name} label={o.name} percent={share(o.value, osTotal)} />
                        ))}
                    </Tile>

                    {/* More details */}
                    <Tile className="lg:col-span-12">
                        <Label>More details</Label>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { title: 'Browsers', rows: stats.browsers.slice(0, 5) },
                                { title: 'Screen width', rows: stats.screenWidths.map(r => ({ ...r, name: r.name === 'Unknown' ? 'Unknown' : `${r.name}px` })) },
                                { title: 'Language', rows: stats.languages },
                                { title: 'Visitor time zone', rows: stats.timezones },
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
            </div>
        </div>
    );
};

export default LinkAnalytics;
