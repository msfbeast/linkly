import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, Monitor, Smartphone, Chrome, MapPin, MousePointer2, Share2, Copy, Check, Split, Download, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { LinkData, ClickEvent, getCategoryColor, LinkStats, LinkAnalytics as LinkAnalyticsData, LinkAnalyticsRange, NameValue } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics } from '../services/aggregatedAnalyticsService';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import LiveWorldMap from '../components/LiveWorldMap';
import { ClickHeatmap } from '../components/ClickHeatmap';

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

const EMPTY_ANALYTICS: LinkAnalyticsData = {
    range: '7d', timezone: 'UTC', total: 0, unique: 0, previousTotal: 0, previousUnique: 0,
    timeline: [], devices: [], browsers: [], oses: [], countries: [], referrers: [], deviceModels: [],
    screenWidths: [], languages: [], timezones: [], regions: [], cities: [], heatmap: [], destinations: [],
};

const LinkAnalytics: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [link, setLink] = useState<LinkData | null>(null);
    const [linkStats, setLinkStats] = useState<LinkStats | null>(null);
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

    useEffect(() => {
        const fetchLink = async () => {
            if (!id) return;
            try {
                // Fetch link data first
                const data = await supabaseAdapter.getLink(id);

                if (data) {
                    setLink(data);
                    setLoading(false);

                    // Fetch stats in background (don't block page load)
                    try {
                        const stats = await aggregatedAnalytics.getLinkStats(id);
                        setLinkStats(stats);
                    } catch (statsError) {
                        console.error('[LinkAnalytics] Failed to load stats (non-blocking):', statsError);
                    }
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
        const url = `${window.location.origin}/#/r/${link.shortCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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

    // 1. Timeline Data: 24 hourly points, or one point per day (last 14 days for All Time)
    const timelineData = (() => {
        const counts = new Map(stats.timeline.map(p => [p.key, p.clicks]));
        const points: { date: string; clicks: number }[] = [];
        if (timeRange === '24h') {
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now - i * 60 * 60 * 1000);
                points.push({
                    date: d.toLocaleTimeString([], { hour: '2-digit', hour12: true }),
                    clicks: counts.get(hourKey(d)) ?? 0,
                });
            }
        } else {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now - i * 24 * 60 * 60 * 1000);
                points.push({
                    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    clicks: counts.get(dayKey(d)) ?? 0,
                });
            }
        }
        return points;
    })();

    // 2. Device & Browser Data
    const deviceData = stats.devices;
    const browserData = stats.browsers;
    const osData = stats.oses;
    const countryData = stats.countries.slice(0, 5);
    const referrerData = stats.referrers;
    const deviceModelData = stats.deviceModels;

    const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];

    const itemsPerPage = ITEMS_PER_PAGE;
    const totalPages = Math.ceil(total / itemsPerPage);
    const paginatedClicks = pageClicks;
    // Share of the range's clicks, for the percentage bars.
    const share = (value: number) => (total > 0 ? value / total : 0);

    // 3. A/B Test Data
    const abTestData = (() => {
        if (!link.abTestConfig?.enabled) return null;

        const variants = link.abTestConfig.variants;
        const clickCounts: Record<string, number> = {};
        stats.destinations.forEach(d => { clickCounts[d.url] = d.clicks; });

        return variants.map(v => ({
            ...v,
            clicks: clickCounts[v.url] || 0,
            percentage: total > 0 ? ((clickCounts[v.url] || 0) / total) * 100 : 0
        }));
    })();

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/links')}
                    className="flex items-center text-stone-500 hover:text-slate-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Links
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{link.title}</h1>
                        <div className="flex items-center gap-4 text-sm">
                            <a
                                href={link.originalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-500 hover:text-amber-600 flex items-center truncate max-w-md"
                            >
                                <Globe className="w-3 h-3 mr-1" />
                                {link.originalUrl}
                            </a>
                            <span className="text-stone-300">|</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-900 bg-white border border-stone-200 px-2 py-0.5 rounded">
                                    /{link.shortCode}
                                </span>
                                <button
                                    onClick={handleCopy}
                                    className="text-stone-400 hover:text-amber-500 transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:text-slate-900 hover:bg-stone-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-wait"
                        >
                            <Download className="w-4 h-4" />
                            {exporting ? 'Exporting…' : 'Export CSV'}
                        </button>
                        <div className="flex bg-white rounded-lg border border-stone-200 p-1 shadow-sm">
                            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => { setTimeRange(range); setCurrentPage(1); }}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === range
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'text-stone-500 hover:bg-stone-50'
                                        }`}
                                >
                                    {range === 'all' ? 'All Time' : range === '24h' ? '24h' : `Last ${range.replace('d', ' Days')}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {(analyticsError || !analytics) && (
                <div className="max-w-6xl mx-auto mb-4">
                    {analyticsError ? (
                        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                            <span>Couldn't load analytics for this range.</span>
                            <button
                                onClick={() => setAnalyticsAttempt(n => n + 1)}
                                className="font-semibold underline underline-offset-2 hover:text-red-900"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            Loading analytics…
                        </div>
                    )}
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Overview Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                <MousePointer2 className="w-5 h-5" />
                            </div>
                            <span className="text-stone-500 text-sm font-medium">Total Clicks</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mb-1">
                            {(linkStats?.totalClicks ?? total).toLocaleString()}
                        </p>
                        <div className={`flex items-center text-xs font-medium ${clickGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {clickGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {Math.abs(clickGrowth)}% vs previous
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <span className="text-stone-500 text-sm font-medium">Unique Visitors</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mb-1">
                            {(linkStats?.uniqueVisitors ?? uniqueClicks).toLocaleString()}
                        </p>
                        <div className={`flex items-center text-xs font-medium ${uniqueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {uniqueGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {Math.abs(uniqueGrowth)}% vs previous
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <span className="text-stone-500 text-sm font-medium">Top Location</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 truncate">
                            {countryData[0]?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-stone-400">{countryData[0]?.value || 0} clicks</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                                <Chrome className="w-5 h-5" />
                            </div>
                            <span className="text-stone-500 text-sm font-medium">Top Browser</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 truncate">
                            {browserData[0]?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-stone-400">{browserData[0]?.value || 0} clicks</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-500">
                                <Share2 className="w-5 h-5" />
                            </div>
                            <span className="text-stone-500 text-sm font-medium">Top Source</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900 truncate">
                            {referrerData[0]?.name === 'direct' ? 'Direct / Email' : referrerData[0]?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-stone-400">{referrerData[0]?.value || 0} clicks</p>
                    </div>
                </div>

                {/* A/B Test Performance */}
                {abTestData && (
                    <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                                <Split className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">A/B Test Performance</h3>
                        </div>

                        <div className="overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-stone-400 uppercase bg-stone-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Variant URL</th>
                                        <th className="px-4 py-3">Configured Weight</th>
                                        <th className="px-4 py-3">Actual Clicks</th>
                                        <th className="px-4 py-3 rounded-r-lg">Traffic Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {abTestData.map((variant, idx) => (
                                        <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-900 font-medium truncate max-w-xs">
                                                {variant.url}
                                            </td>
                                            <td className="px-4 py-3 text-stone-500">
                                                {variant.weight}%
                                            </td>
                                            <td className="px-4 py-3 text-slate-900 font-bold">
                                                {variant.clicks}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-500 rounded-full"
                                                            style={{ width: `${variant.percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-stone-500 w-10 text-right">
                                                        {variant.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Timeline Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Click Trends</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50} initialDimension={{ width: 400, height: 256 }}>
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorClicks)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Browser Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Browsers</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50} initialDimension={{ width: 400, height: 256 }}>
                            <PieChart>
                                <Pie
                                    data={browserData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {browserData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                        {browserData.map((entry, index) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm text-stone-600">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map & Geography Row */}
                <div className="lg:col-span-2 bg-white p-1 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                    <LiveWorldMap
                        countryCounts={stats.countries}
                        regionCounts={stats.regions}
                        serverCityData={stats.cities.map(c => ({ city: c.city, country: c.country, clickCount: c.value }))}
                        className="h-[400px] w-full rounded-xl border-none"
                    />
                </div>

                {/* Geography Table */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Top Locations</h3>
                    <div className="space-y-3">
                        {countryData.map((item, idx) => (
                            <div key={item.name} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-stone-400 w-4">#{idx + 1}</span>
                                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-stone-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${share(item.value) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-stone-500 w-8 text-right">{item.value}</span>
                                </div>
                            </div>
                        ))}
                        {countryData.length === 0 && (
                            <p className="text-stone-400 text-sm text-center py-4">No location data yet</p>
                        )}
                    </div>
                </div>

                {/* Device & OS */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Devices & OS</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Device Type</h4>
                            <div className="space-y-2">
                                {deviceData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">{item.name}</span>
                                        <span className="font-medium text-slate-900">{Math.round(share(item.value) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-px bg-stone-100" />
                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Operating System</h4>
                            <div className="space-y-2">
                                {osData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">{item.name}</span>
                                        <span className="font-medium text-slate-900">{Math.round(share(item.value) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-px bg-stone-100" />
                        <div>
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Device Models</h4>
                            <div className="space-y-2">
                                {deviceModelData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700 truncate max-w-[150px]" title={item.name}>
                                            {item.name === 'Unknown' ? 'Generic / Unknown' : item.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-stone-400 text-xs">{item.value}</span>
                                            <span className="font-medium text-slate-900">{Math.round(share(item.value) * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                                {deviceModelData.length === 0 && <p className="text-stone-400 text-xs">No model data available</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* UTM Parameters */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Marketing Campaigns (UTM)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {['utm_source', 'utm_medium', 'utm_campaign'].map((field) => {
                            // Clicks don't record UTM parameters yet.
                            const data: NameValue[] = [];
                            return (
                                <div key={field}>
                                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
                                        {field.replace('utm_', '')}
                                    </h4>
                                    <div className="space-y-3">
                                        {data.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <span className="text-slate-700 truncate max-w-[150px]" title={item.name}>
                                                    {item.name === 'Unknown' ? '-' : item.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full"
                                                            style={{ width: `${share(item.value) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-medium text-slate-900 text-xs w-6 text-right">{item.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {data.length === 0 && <p className="text-stone-400 text-xs">No data</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Heatmap */}
                <div className="lg:col-span-3 h-[400px]">
                    <ClickHeatmap counts={stats.heatmap} />
                </div>

                {/* Tech Details & Locale */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Technical Details */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Technical Details</h3>
                        <div className="space-y-6">
                            {[
                                // Clicks don't record browser or OS versions yet.
                                { label: 'Browser Version', data: [] as NameValue[] },
                                { label: 'OS Version', data: [] as NameValue[] },
                                { label: 'Screen Resolution', data: stats.screenWidths, format: (v: string) => v !== 'Unknown' ? `${v}px width` : 'Unknown' }
                            ].map((metric) => {
                                const data = metric.data;
                                return (
                                    <div key={metric.label}>
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">{metric.label}</h4>
                                        <div className="space-y-2">
                                            {data.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-700">
                                                        {metric.format ? metric.format(item.name) : (item.name === 'Unknown' ? '-' : item.name)}
                                                    </span>
                                                    <span className="font-medium text-slate-900">{item.value}</span>
                                                </div>
                                            ))}
                                            {data.length === 0 && <p className="text-stone-400 text-xs">No data</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Locale & Time */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Locale & Time</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Language', data: stats.languages },
                                { label: 'Timezone', data: stats.timezones }
                            ].map((metric) => {
                                const data = metric.data;
                                return (
                                    <div key={metric.label}>
                                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">{metric.label}</h4>
                                        <div className="space-y-2">
                                            {data.map((item) => (
                                                <div key={item.name} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-700">{item.name === 'Unknown' ? '-' : item.name}</span>
                                                    <span className="font-medium text-slate-900">{item.value}</span>
                                                </div>
                                            ))}
                                            {data.length === 0 && <p className="text-stone-400 text-xs">No data</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                        <span className="text-sm text-stone-500">
                            Showing {paginatedClicks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, total)} of {total.toLocaleString()}
                        </span>
                    </div>
                    <div className="overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-stone-400 uppercase bg-stone-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Time</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Device</th>
                                    <th className="px-4 py-3 rounded-r-lg">Referrer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {paginatedClicks.map((click, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                                        <td className="px-4 py-3 text-stone-500">
                                            {new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span className="text-xs text-stone-300 ml-2">
                                                {new Date(click.timestamp).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-900">{click.country || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-stone-600">
                                            {click.browser || 'Unknown'} on {click.os}
                                        </td>
                                        <td className="px-4 py-3 text-stone-500 truncate max-w-[150px]">
                                            {click.referrer === 'direct' ? 'Direct' : click.referrer}
                                        </td>
                                    </tr>
                                ))}
                                {total === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                                            No clicks recorded in this period
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-lg border border-stone-200 text-stone-500 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Logic to show window of pages around current
                                    let p = i + 1;
                                    if (totalPages > 5) {
                                        if (currentPage > 3) p = currentPage - 2 + i;
                                        if (p > totalPages) p = totalPages - 4 + i;
                                    }
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === p
                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                                                : 'text-stone-500 hover:bg-stone-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded-lg border border-stone-200 text-stone-500 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div >
    );
};

export default LinkAnalytics;
