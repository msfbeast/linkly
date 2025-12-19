import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart3, Globe, MousePointer2, MapPin, Monitor, Smartphone, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/storage/supabaseClient';

interface SharedAnalyticsData {
    displayName: string;
    stats: {
        totalClicks: number;
        clicksThisWeek: number;
        clicksLastWeek: number;
        clicksThisMonth: number;
    };
    countries: { country: string; clickCount: number }[];
    cities: { city: string; country: string; clickCount: number }[];
    devices: { device: string; clickCount: number }[];
    browsers: { browser: string; clickCount: number }[];
}

// Use getCountryName from constants
import { getCountryName } from '../utils/constants';

const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 };
    const percentage = ((current - previous) / previous) * 100;
    return { percentage: Math.abs(Math.round(percentage)), isPositive: percentage >= 0 };
};

const GrowthBadge: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
    const { percentage, isPositive } = calculateGrowth(current, previous);
    if (previous === 0 && current === 0) return null;

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{percentage}%</span>
        </div>
    );
};

const SharedAnalytics: React.FC = () => {
    const { shareToken } = useParams<{ shareToken: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SharedAnalyticsData | null>(null);

    useEffect(() => {
        loadSharedAnalytics();
    }, [shareToken]);

    const loadSharedAnalytics = async () => {
        if (!isSupabaseConfigured() || !supabase || !shareToken) {
            setError('Invalid share link');
            setIsLoading(false);
            return;
        }

        try {
            // Call RPC to get shared analytics data
            const { data: result, error: rpcError } = await supabase.rpc('get_shared_analytics', {
                p_share_token: shareToken
            });

            if (rpcError || !result) {
                setError('This share link is invalid or has expired');
                setIsLoading(false);
                return;
            }

            setData(result);
        } catch (err) {
            setError('Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-4" />
                    <p className="text-stone-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Not Found</h1>
                    <p className="text-stone-500">{error || 'This share link is invalid or has expired.'}</p>
                </div>
            </div>
        );
    }

    const maxClicks = Math.max(...(data.countries?.map(c => c.clickCount) || [1]));

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center py-8">
                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
                        <Globe className="w-4 h-4" />
                        <span>Shared Analytics Report</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{data.displayName}'s Analytics</h1>
                    <p className="text-stone-500 mt-2">Real-time stats from Gather</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <MousePointer2 className="w-5 h-5 text-yellow-600" />
                                </div>
                                <span className="text-stone-500 text-sm">This Week</span>
                            </div>
                            <GrowthBadge current={data.stats.clicksThisWeek} previous={data.stats.clicksLastWeek} />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{data.stats.clicksThisWeek.toLocaleString()}</p>
                        <p className="text-xs text-stone-400 mt-1">vs {data.stats.clicksLastWeek.toLocaleString()} last week</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-stone-500 text-sm">Total Clicks</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{data.stats.totalClicks.toLocaleString()}</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-stone-500 text-sm">This Month</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{data.stats.clicksThisMonth.toLocaleString()}</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Globe className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-stone-500 text-sm">Countries</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{data.countries?.length || 0}</p>
                    </div>
                </div>

                {/* Countries & Cities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-slate-900 font-bold">Top Countries</h3>
                        </div>
                        <div className="space-y-4">
                            {data.countries?.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="text-stone-400 text-sm w-6">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-slate-900 text-sm font-medium">{getCountryName(item.country)}</span>
                                            <span className="text-stone-500 text-sm">{item.clickCount.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(item.clickCount / maxClicks) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-cyan-500" />
                            <h3 className="text-slate-900 font-bold">Top Cities</h3>
                        </div>
                        <div className="space-y-3">
                            {data.cities?.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-stone-400 text-sm">{i + 1}</span>
                                        <span className="text-slate-900 font-medium">{item.city}</span>
                                    </div>
                                    <span className="text-stone-500 text-sm">{item.clickCount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Devices & Browsers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Monitor className="w-5 h-5 text-blue-500" />
                            <h3 className="text-slate-900 font-bold">Devices</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {data.devices?.slice(0, 3).map((item, i) => (
                                <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                                    <p className="text-slate-900 font-bold text-lg">{item.clickCount.toLocaleString()}</p>
                                    <p className="text-stone-500 text-sm">{item.device}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Smartphone className="w-5 h-5 text-purple-500" />
                            <h3 className="text-slate-900 font-bold">Browsers</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {data.browsers?.slice(0, 3).map((item, i) => (
                                <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                                    <p className="text-slate-900 font-bold text-lg">{item.clickCount.toLocaleString()}</p>
                                    <p className="text-stone-500 text-sm">{item.browser}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-8 text-stone-400 text-sm">
                    <p>Powered by <a href="/" className="text-yellow-600 hover:underline font-medium">Gather</a></p>
                </div>
            </div>
        </div>
    );
};

export default SharedAnalytics;
