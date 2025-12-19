import React, { useState, useEffect } from 'react';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { LinkData } from '../../types';
import { DollarSign, TrendingUp, ShoppingCart, ExternalLink, ArrowUpRight, Filter, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const { currentTeam } = useTeam();
    const [links, setLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [earningsPeriod, setEarningsPeriod] = useState<'30d' | '90d' | 'all'>('30d');

    useEffect(() => {
        const fetchLinks = async () => {
            if (!user?.id) return;
            try {
                const data = await supabaseAdapter.getLinks(currentTeam?.id);
                const affiliateLinks = data.filter(link => {
                    const url = link.originalUrl.toLowerCase();
                    return (
                        url.includes('amazon.') ||
                        url.includes('amzn.to') ||
                        url.includes('amzn.in') ||
                        url.includes('flipkart.com') ||
                        url.includes('fkrt.it') ||
                        url.includes('tag=') ||
                        url.includes('affid=') ||
                        url.includes('ref=') ||
                        link.tags?.includes('affiliate')
                    );
                });
                setLinks(affiliateLinks);
            } catch (error) {
                console.error('Error fetching affiliate links:', error);
                toast.error('Failed to load affiliate data');
            } finally {
                setLoading(false);
            }
        };

        fetchLinks();
    }, [user]);

    // Mock calculations for MVP
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const estimatedConversionRate = 0.025; // 2.5% mock conversion
    const estimatedConversions = Math.round(totalClicks * estimatedConversionRate);
    const avgCommission = 1.50; // $1.50 avg commission
    const estimatedEarnings = estimatedConversions * avgCommission;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Affiliate Earnings</h2>
                    <p className="text-stone-500">Track performance of your Amazon & Flipkart links</p>
                </div>
                <div className="flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setEarningsPeriod('30d')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${earningsPeriod === '30d' ? 'bg-indigo-50 text-indigo-700' : 'text-stone-500 hover:text-slate-900'}`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setEarningsPeriod('90d')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${earningsPeriod === '90d' ? 'bg-indigo-50 text-indigo-700' : 'text-stone-500 hover:text-slate-900'}`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-16 h-16 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-stone-500 mb-1">Est. Earnings</p>
                        <h3 className="text-3xl font-bold text-slate-900">
                            ${estimatedEarnings.toFixed(2)}
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span>+12.5% vs last month</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-stone-500 mb-1">Est. Conversions</p>
                        <h3 className="text-3xl font-bold text-slate-900">
                            {estimatedConversions}
                        </h3>
                        <p className="text-xs text-stone-400 mt-2">
                            Based on ~{(estimatedConversionRate * 100).toFixed(1)}% conversion rate
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ExternalLink className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-stone-500 mb-1">Total Clicks</p>
                        <h3 className="text-3xl font-bold text-slate-900">
                            {totalClicks.toLocaleString()}
                        </h3>
                        <p className="text-xs text-stone-400 mt-2">
                            From {links.length} active affiliate links
                        </p>
                    </div>
                </div>
            </div>

            {/* Links Table */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Monetized Links</h3>
                    <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                        View All <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 text-stone-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Link Name</th>
                                <th className="px-6 py-4 font-medium">Store</th>
                                <th className="px-6 py-4 font-medium text-right">Clicks</th>
                                <th className="px-6 py-4 font-medium text-right">Est. Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {links.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                                        No affiliate links found. Add Amazon or Flipkart links to see stats here.
                                    </td>
                                </tr>
                            ) : (
                                links.map(link => {
                                    const isAmz = link.originalUrl.includes('amazon');
                                    const storeName = isAmz ? 'Amazon' : 'Flipkart';
                                    const estValue = (link.clicks || 0) * estimatedConversionRate * avgCommission;

                                    return (
                                        <tr key={link.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-slate-900">{link.title}</div>
                                                    <div className="text-xs text-stone-400 truncate max-w-[200px]">{link.originalUrl}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isAmz ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {storeName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                                {link.clicks || 0}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">
                                                ${estValue.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AffiliateDashboard;
