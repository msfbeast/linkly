
import React from 'react';
import { motion } from 'framer-motion';
import TopCitiesTable from './TopCitiesTable';

import ClickForecastChart from '../ClickForecastChart';
import TrafficSourceChart, { calculateTrafficTotal } from '../TrafficSourceChart';
import { HealthScoreCard } from '../HealthScoreCard';
import { InsightsCard, Insight } from '../InsightsCard';
import { LinkData, generateLinkHealthData } from '../../types';

interface AnalyticsOverviewProps {
    links: LinkData[];
    isLoading: boolean;
    clickForecastData: { date: string; actual: number; forecast: number }[];
    trafficSourceData: { name: string; value: number; color: string }[];
    totalClicks?: number;
}

// Helper to generate city data
function generateCityData(links: LinkData[]) {
    const cityCounts: Record<string, { count: number; country: string }> = {};
    let totalClicks = 0;

    // Debug logging
    console.log('[CityData] Processing links:', links.length);
    let totalClickHistory = 0;
    let clicksWithCity = 0;

    links.forEach(link => {
        totalClickHistory += link.clickHistory?.length || 0;
        link.clickHistory?.forEach(click => {
            if (click.city) {
                clicksWithCity++;
                const key = `${click.city}-${click.country || 'Unknown'}`;
                if (!cityCounts[key]) {
                    cityCounts[key] = { count: 0, country: click.country || 'Unknown' };
                }
                cityCounts[key].count++;
                totalClicks++;
            }
        });
    });

    console.log('[CityData] Total click history entries:', totalClickHistory);
    console.log('[CityData] Clicks with city:', clicksWithCity);
    console.log('[CityData] City counts:', JSON.stringify(cityCounts, null, 2));

    const result = Object.entries(cityCounts)
        .map(([key, data]) => {
            // Decode URL-encoded city names (e.g., "New%20Delhi" → "New Delhi")
            const rawCity = key.split('-')[0];
            let decodedCity = rawCity;
            try {
                decodedCity = decodeURIComponent(rawCity);
            } catch (e) {
                // If decoding fails, use the raw city name
                decodedCity = rawCity;
            }
            return {
                city: decodedCity,
                country: data.country,
                count: data.count,
                percentage: totalClicks > 0 ? Math.round((data.count / totalClicks) * 100) : 0
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 cities

    console.log('[CityData] Final result:', JSON.stringify(result, null, 2));
    return result;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
    links,
    isLoading,
    clickForecastData,
    trafficSourceData,
    totalClicks
}) => {
    // Generate health data
    const linkHealthData = generateLinkHealthData(links);
    const cityData = generateCityData(links);

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
                className="min-w-0 h-[400px]"
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
                <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full min-h-[320px] min-w-0">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Click Forecast</h3>
                        <p className="text-stone-500 text-sm">Predicted vs Actual Performance</p>
                    </div>
                    <div className="h-[250px] w-full min-w-0">
                        <ClickForecastChart data={clickForecastData} />
                    </div>
                </div>
            </motion.div>

            {/* Top Cities - New Component */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="min-w-0 h-[400px]"
            >
                <TopCitiesTable data={cityData} />
            </motion.div>
        </div>
    );
};

export default AnalyticsOverview;
