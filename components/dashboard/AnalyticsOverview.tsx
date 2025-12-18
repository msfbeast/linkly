
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import TopCitiesTable from './TopCitiesTable';
import { BrowserStats } from './BrowserStats';
import { OSStats } from './OSStats';
import { ReferrerStats } from './ReferrerStats';

import ClickForecastChart from '../ClickForecastChart';
import TrafficSourceChart, { calculateTrafficTotal } from '../TrafficSourceChart';
import { HealthScoreCard } from '../HealthScoreCard';
import { InsightsCard, Insight } from '../InsightsCard';
import { LinkData, generateLinkHealthData } from '../../types';
import { CityBreakdown } from '../../services/aggregatedAnalyticsService';

interface AnalyticsOverviewProps {
    links: LinkData[];
    isLoading: boolean;
    clickForecastData: { date: string; actual: number; forecast: number }[];
    trafficSourceData: { name: string; value: number; color: string }[];
    totalClicks?: number;
    serverCityData?: CityBreakdown[];
    serverOsData?: any[];
    serverBrowserData?: any[];
    serverReferrerData?: any[];
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
    links,
    isLoading,
    clickForecastData,
    trafficSourceData,
    totalClicks,
    serverCityData = [],
    serverOsData,
    serverBrowserData,
    serverReferrerData
}) => {
    // Generate health data
    const linkHealthData = generateLinkHealthData(links);

    // Use server-side city data if available, format for TopCitiesTable
    const totalCityClicks = serverCityData.reduce((sum, c) => sum + c.clickCount, 0);
    const cityData = serverCityData.slice(0, 5).map(city => ({
        city: city.city,
        country: city.country,
        count: city.clickCount,
        percentage: totalCityClicks > 0 ? Math.round((city.clickCount / totalCityClicks) * 100) : 0
    }));

    // Aggregate Browser and OS Data
    const { browserStats, osStats } = useMemo(() => {
        // Use server data if available
        if (serverOsData?.length && serverBrowserData?.length) {
            // Transform server OS data
            const osData = serverOsData.map((item: any) => ({
                name: item.os === 'ios' ? 'iOS' :
                    item.os === 'macos' ? 'macOS' :
                        item.os.charAt(0).toUpperCase() + item.os.slice(1),
                value: item.clickCount,
                color: '' // Will be handled by component
            }));

            // Transform server Browser data
            const browserData = serverBrowserData.map((item: any) => ({
                name: item.browser,
                value: item.clickCount
            })).slice(0, 5);

            return { browserStats: browserData, osStats: osData };
        }

        const browsers: Record<string, number> = {};
        const oss: Record<string, number> = {};

        links.forEach(link => {
            link.clickHistory.forEach(click => {
                const browser = click.browser || 'Unknown';
                const os = click.os || 'Unknown';
                browsers[browser] = (browsers[browser] || 0) + 1;
                // Capitalize OS for display
                const osDisplay = os === 'ios' ? 'iOS' :
                    os === 'macos' ? 'macOS' :
                        os.charAt(0).toUpperCase() + os.slice(1);
                oss[osDisplay] = (oss[osDisplay] || 0) + 1;
            });
        });

        const browserData = Object.entries(browsers)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const osColors: Record<string, string> = {
            'iOS': '#000000',
            'Android': '#3DDC84',
            'Windows': '#00A4EF',
            'macOS': '#666666',
            'Linux': '#FCC624',
            'Unknown': '#d6d3d1'
        };

        const osData = Object.entries(oss)
            .map(([name, value]) => ({
                name,
                value,
                color: osColors[name] || '#d6d3d1'
            }))
            .sort((a, b) => b.value - a.value);

        return { browserStats: browserData, osStats: osData };
    }, [links, serverOsData, serverBrowserData]);


    // Generate insights
    const insights: Insight[] = links
        .filter(link => {
            // Links with low clicks
            if (link.clicks < 5 && Date.now() - link.createdAt > 3 * 24 * 60 * 60 * 1000) {
                return true;
            }
            return false;
        })
        .slice(0, 3)
        .map(link => ({
            id: link.id,
            type: 'info',
            title: 'Low Engagement',
            description: `"${link.title}" has low click - through rate.`,
        }));

    // Add a positive insight if no issues
    if (insights.length === 0) {
        insights.push({
            id: 'all-good',
            type: 'success' as const,
            title: 'All Systems Go',
            description: 'Your links are performing well.',
        });
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {/* Health Score Skeleton */}
                <div className="h-[200px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm animate-pulse">
                    <div className="h-4 w-24 bg-stone-200 rounded-full mb-8" />
                    <div className="h-16 w-16 bg-stone-200 rounded-full mb-4" />
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-stone-100 rounded-full" />
                        <div className="h-3 w-2/3 bg-stone-100 rounded-full" />
                    </div>
                </div>

                {/* Insights Skeleton */}
                <div className="h-[200px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm animate-pulse">
                    <div className="h-4 w-32 bg-stone-200 rounded-full mb-6" />
                    <div className="space-y-4">
                        <div className="h-12 w-full bg-stone-100 rounded-xl" />
                        <div className="h-12 w-full bg-stone-100 rounded-xl" />
                    </div>
                </div>

                {/* Traffic Chart Skeleton */}
                <div className="h-[400px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm animate-pulse md:col-span-1 lg:col-span-1">
                    <div className="h-4 w-40 bg-stone-200 rounded-full mb-8" />
                    <div className="h-64 w-64 mx-auto bg-stone-100 rounded-full" />
                </div>

                {/* Forecast Chart Skeleton */}
                <div className="md:col-span-2 lg:col-span-2 h-[320px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm animate-pulse">
                    <div className="h-4 w-32 bg-stone-200 rounded-full mb-8" />
                    <div className="h-full w-full bg-stone-100 rounded-xl mt-4" />
                </div>

                {/* Top Cities Skeleton */}
                <div className="h-[400px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm animate-pulse">
                    <div className="h-4 w-28 bg-stone-200 rounded-full mb-8" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="h-3 w-24 bg-stone-100 rounded-full" />
                                <div className="h-3 w-12 bg-stone-100 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Health Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <HealthScoreCard
                    score={linkHealthData.find(d => d.metric === 'Score')?.value || 0}
                    metrics={{
                        avgClicks: linkHealthData.find(d => d.metric === 'Avg Clicks')?.value || 0,
                        growth: linkHealthData.find(d => d.metric === 'Growth')?.value || 0,
                        engagement: linkHealthData.find(d => d.metric === 'Engagement')?.value || 0,
                        reach: linkHealthData.find(d => d.metric === 'Reach')?.value || 0,
                    }}
                />
            </motion.div>

            {/* Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <InsightsCard insights={insights} />
            </motion.div>

            {/* Traffic Sources */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="min-w-0 min-h-[400px]"
            >
                <TrafficSourceChart
                    data={trafficSourceData}
                    total={totalClicks ?? calculateTrafficTotal(trafficSourceData)}
                />
            </motion.div>

            {/* Click Forecast */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 lg:col-span-2 min-w-0"
            >
                <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full min-h-[320px] min-w-0 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Click Forecast</h3>
                        <p className="text-stone-500 text-sm">Predicted vs Actual Performance</p>
                    </div>
                    <div className="h-[250px] w-full min-w-0">
                        <ClickForecastChart data={clickForecastData} />
                    </div>
                </div>
            </motion.div>

            {/* Top Cities */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="min-w-0 min-h-[400px]"
            >
                <TopCitiesTable data={cityData} />
            </motion.div>

            {/* Browser Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="min-w-0 min-h-[400px]"
            >
                <BrowserStats data={browserStats} />
            </motion.div>

            {/* OS Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="min-w-0 min-h-[400px]"
            >
                <OSStats data={osStats} />
            </motion.div>

            {/* Referrer Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="min-w-0 min-h-[400px]"
            >
                <ReferrerStats data={serverReferrerData?.map((r: any) => ({ name: r.referrer, value: r.clickCount })) || []} />
            </motion.div>
        </div>
    );
};

export default AnalyticsOverview;
