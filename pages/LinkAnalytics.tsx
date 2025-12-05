import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Globe, Monitor, Smartphone, Chrome, MapPin, MousePointer2, Share2, Copy, Check, Split, Download, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { LinkData, ClickEvent, getCategoryColor } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics, LinkStats } from '../services/aggregatedAnalyticsService';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import LiveWorldMap from '../components/LiveWorldMap';

const LinkAnalytics: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [link, setLink] = useState<LinkData | null>(null);
    const [linkStats, setLinkStats] = useState<LinkStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
    const [currentPage, setCurrentPage] = useState(1);

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
                        console.log('[LinkAnalytics] Stats loaded:', stats);
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

    // Debug: log linkStats to verify it's being used
    console.log('[LinkAnalytics] Rendering with linkStats:', linkStats, 'filteredClicksLength will be from clickHistory');

    // --- Data Processing ---

    // Filter clicks by time range
    const now = Date.now();
    const getTimeLimit = (range: typeof timeRange) => {
        switch (range) {
            case '24h': return 24 * 60 * 60 * 1000;
            case '7d': return 7 * 24 * 60 * 60 * 1000;
            case '30d': return 30 * 24 * 60 * 60 * 1000;
            default: return Infinity;
        }
    };

    const timeLimit = getTimeLimit(timeRange);
    const filteredClicks = link.clickHistory.filter(c => (now - c.timestamp) <= timeLimit);

    // Calculate Comparison Metrics (Previous Period)
    const previousTimeLimit = timeLimit * 2;
    const previousClicks = link.clickHistory.filter(c =>
        (now - c.timestamp) > timeLimit && (now - c.timestamp) <= previousTimeLimit
    );

    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    const clickGrowth = calculateGrowth(filteredClicks.length, previousClicks.length);

    const uniqueClicks = new Set(filteredClicks.map(c => c.visitorId).filter(Boolean)).size;
    const previousUniqueClicks = new Set(previousClicks.map(c => c.visitorId).filter(Boolean)).size;
    const uniqueGrowth = calculateGrowth(uniqueClicks, previousUniqueClicks);

    // Export to CSV
    const handleExportCSV = () => {
        const headers = ['Timestamp', 'Country', 'City', 'Device', 'OS', 'Browser', 'Referrer', 'Visitor ID'];
        const rows = filteredClicks.map(c => [
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
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `linkly_analytics_${id}_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Timeline Data
    // 1. Timeline Data
    const timelineData = (() => {
        const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
        const data: Record<string, number> = {};

        if (timeRange === '24h') {
            // Hourly breakdown for 24h
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now - i * 60 * 60 * 1000);
                const key = d.toLocaleTimeString([], { hour: '2-digit', hour12: true });
                data[key] = 0;
            }
            filteredClicks.forEach(click => {
                const key = new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', hour12: true });
                if (data[key] !== undefined) data[key]++;
            });
        } else {
            // Daily breakdown
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now - i * 24 * 60 * 60 * 1000);
                const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                data[key] = 0;
            }
            filteredClicks.forEach(click => {
                const key = new Date(click.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (data[key] !== undefined) data[key]++;
            });
        }

        return Object.entries(data).map(([date, clicks]) => ({ date, clicks }));
    })();

    // 2. Device & Browser Data
    const getDistribution = (field: keyof ClickEvent) => {
        const counts: Record<string, number> = {};
        filteredClicks.forEach(c => {
            const val = (c[field] as string) || 'Unknown';
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    const deviceData = getDistribution('device');
    const browserData = getDistribution('browser');
    const osData = getDistribution('os');
    const countryData = getDistribution('country').slice(0, 5);
    const referrerData = getDistribution('referrer').slice(0, 5);

    const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredClicks.length / itemsPerPage);

    const paginatedClicks = filteredClicks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );



    // 3. A/B Test Data
    const abTestData = (() => {
        if (!link.abTestConfig?.enabled) return null;

        const variants = link.abTestConfig.variants;
        const totalClicks = filteredClicks.length;

        // Count clicks per destination URL
        const clickCounts: Record<string, number> = {};
        filteredClicks.forEach(c => {
            if (c.destinationUrl) {
                clickCounts[c.destinationUrl] = (clickCounts[c.destinationUrl] || 0) + 1;
            } else {
                // Fallback for older clicks or if destinationUrl missing - assume originalUrl?
                // Or just count as "Other/Original"
                clickCounts['original'] = (clickCounts['original'] || 0) + 1;
            }
        });

        return variants.map(v => ({
            ...v,
            clicks: clickCounts[v.url] || 0,
            percentage: totalClicks > 0 ? ((clickCounts[v.url] || 0) / totalClicks) * 100 : 0
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
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:text-slate-900 hover:bg-stone-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <div className="flex bg-white rounded-lg border border-stone-200 p-1 shadow-sm">
                            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
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
                            {(linkStats?.totalClicks ?? filteredClicks.length).toLocaleString()}
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
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={browserData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {browserData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map & Geography Row */}
                <div className="lg:col-span-2 bg-white p-1 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                    <LiveWorldMap clickHistory={filteredClicks} className="h-[400px] w-full rounded-xl border-none" />
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
                                            style={{ width: `${(item.value / filteredClicks.length) * 100}%` }}
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
                                        <span className="font-medium text-slate-900">{Math.round((item.value / filteredClicks.length) * 100)}%</span>
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
                                        <span className="font-medium text-slate-900">{Math.round((item.value / filteredClicks.length) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* UTM Parameters */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Marketing Campaigns (UTM)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {['utm_source', 'utm_medium', 'utm_campaign'].map((field) => {
                            const data = getDistribution(field as keyof ClickEvent).slice(0, 5);
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
                                                            style={{ width: `${(item.value / filteredClicks.length) * 100}%` }}
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

                {/* Tech Details & Locale */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Technical Details */}
                    <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Technical Details</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Browser Version', field: 'browserVersion' },
                                { label: 'OS Version', field: 'osVersion' },
                                { label: 'Screen Resolution', field: 'screenWidth', format: (v: any) => v ? `${v}px width` : 'Unknown' }
                            ].map((metric) => {
                                const data = getDistribution(metric.field as keyof ClickEvent).slice(0, 3);
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
                                { label: 'Language', field: 'language' },
                                { label: 'Timezone', field: 'timezone' }
                            ].map((metric) => {
                                const data = getDistribution(metric.field as keyof ClickEvent).slice(0, 5);
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
                            Showing {paginatedClicks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredClicks.length)} of {filteredClicks.length}
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
                                {filteredClicks.length === 0 && (
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
        </div>
    );
};

export default LinkAnalytics;
