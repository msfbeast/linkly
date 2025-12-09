import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { BioAnalyticsData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Loader2, TrendingUp, Users, MousePointer2, Eye, Globe, Smartphone } from 'lucide-react';

interface BioAnalyticsDashboardProps {
    userId: string;
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

export const BioAnalyticsDashboard: React.FC<BioAnalyticsDashboardProps> = ({ userId }) => {
    const [data, setData] = useState<BioAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [velocity, setVelocity] = useState<EngagementVelocity | null>(null);
    const [personas, setPersonas] = useState<AudiencePersona[]>([]);
    const [rank, setRank] = useState<CreatorRank | null>(null);
    const [dateRange, setDateRange] = useState(30);

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const analytics = await supabaseAdapter.getBioAnalytics(userId, dateRange);
                setData(analytics);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setForecastData(forecast);

                // Oracle & Gamification
                const v = calculateVelocity(fetchedLinks);
                const p = generatePersonas(fetchedLinks);
                const r = calculateCreatorRank(fetchedLinks);
                setVelocity(v);
                setPersonas(p);
                setRank(r);

                setLoading(false);
            }
        };

        if (userId) loadAnalytics();
    }, [userId, dateRange]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-medium">Crunching the numbers...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Views"
                    value={data.overview.totalViews}
                    icon={<Eye className="w-4 h-4 text-blue-500" />}
                    bg="bg-blue-50"
                />
                <KpiCard
                    title="Total Clicks"
                    value={data.overview.totalClicks}
                    icon={<MousePointer2 className="w-4 h-4 text-purple-500" />}
                    bg="bg-purple-50"
                />
                <KpiCard
                    title="CTR"
                    value={`${data.overview.ctr}%`}
                    icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                    bg="bg-green-50"
                />
                <KpiCard
                    title="Subscribers"
                    value={data.overview.totalSubscribers}
                    icon={<Users className="w-4 h-4 text-amber-500" />}
                    bg="bg-amber-50"
                />
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900">Performance Over Time</h3>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value))}
                        className="text-xs font-bold bg-stone-100 border-none rounded-lg px-3 py-1.5 cursor-pointer outline-none focus:ring-2 focus:ring-amber-400"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 3 Months</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.clicksOverTime}>
                            <defs>
                                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                minTickGap={30}
                                tickFormatter={(str) => {
                                    const d = new Date(str);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#F59E0B', strokeDasharray: '3 3' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="clicks"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorClicks)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Oracle Insights Section */}
            <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-white rounded-3xl p-6 border border-indigo-100/50 shadow-sm relative overflow-hidden">

                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-indigo-900/20 text-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">The Oracle</h3>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1">AI Insights & Gamification</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
                    {/* 1. Creator Rank */}
                    <div className="lg:col-span-1">
                        {rank && <RankBadge rank={rank} />}
                    </div>

                    {/* 2. Velocity */}
                    <div className="lg:col-span-1">
                        {velocity && <VelocityGauge velocity={velocity} />}
                    </div>

                    {/* 3. Personas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 h-full flex flex-col">
                            <h3 className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-4">Detected Personas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                                {personas.length > 0 ? (
                                    personas.map(persona => (
                                        <AudiencePersonaCard key={persona.id} persona={persona} />
                                    ))
                                ) : (
                                    <div className="col-span-2 border-2 border-dashed border-stone-100 rounded-xl flex flex-col items-center justify-center text-center bg-stone-50/50">
                                        <span className="text-3xl mb-3 opacity-30">🔮</span>
                                        <p className="text-stone-500 font-bold text-sm">Validating Identity...</p>
                                        <p className="text-xs text-stone-400 mt-1">Need more data to generate personas.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Geo Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Globe className="w-4 h-4 text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-slate-900">Top Locations</h3>
                    </div>
                    <div className="space-y-4">
                        {data.byLocation.map((loc, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-stone-600">{loc.name}</span>
                                <div className="flex items-center gap-3 flex-1 justify-end">
                                    <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(loc.value / data.overview.totalClicks) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 w-8 text-right">{loc.value}</span>
                                </div>
                            </div>
                        ))}
                        {data.byLocation.length === 0 && (
                            <p className="text-sm text-stone-400 text-center py-8">No location data yet</p>
                        )}
                    </div>
                </div>

                {/* Top Links */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-slate-900">Top Performing Links</h3>
                    </div>
                    <div className="space-y-4">
                        {data.topLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-xl transition-colors border border-transparent hover:border-stone-100">
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500 text-xs">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate text-sm">{link.title}</p>
                                    <p className="text-xs text-stone-400 truncate">{link.url}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-slate-900 text-sm">{link.clicks}</span>
                                    <span className="text-[10px] text-stone-400 uppercase font-bold">Clicks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, bg }: { title: string, value: string | number, icon: React.ReactNode, bg: string }) => (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
        <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ${bg}`} />
        <div className="flex items-start justify-between relative z-10">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{title}</span>
            <div className={`p-2 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <span className="text-2xl font-black text-slate-900">{value}</span>
        </div>
    </div>
);
