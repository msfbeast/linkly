import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, MousePointer2, TrendingUp, Loader2, MapPin, Monitor, Smartphone } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics, UserClickStats, CountryBreakdown, CityBreakdown, DeviceBreakdown, ReferrerBreakdown, BrowserBreakdown, DailyClicks } from '../services/aggregatedAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import { LinkData, ClickEvent } from '../types';
import LiveWorldMap from '../components/LiveWorldMap';

interface ServerAnalytics {
  stats: UserClickStats | null;
  countries: CountryBreakdown[];
  cities: CityBreakdown[];
  devices: DeviceBreakdown[];
  referrers: ReferrerBreakdown[];
  browsers: BrowserBreakdown[];
  clicksOverTime: DailyClicks[];
}

interface AnalyticsSummary {
  totalClicks: number;
  totalLinks: number;
  uniqueCountries: number;
  topCountries: { country: string; clicks: number }[];
  topCities: { city: string; country: string; clicks: number }[];
  topDevices: { device: string; clicks: number }[];
  topBrowsers: { browser: string; clicks: number }[];
  clicksByDay: { date: string; clicks: number }[];
  recentClicks: ClickEvent[];
  filteredClicks: ClickEvent[]; // Full dataset for map visualization
  // Advanced Analytics
  topSources: { source: string; clicks: number }[];
  topCampaigns: { campaign: string; clicks: number }[];
  triggerSource: { source: string; clicks: number }[];
  heatmapData: { day: number; hour: number; clicks: number }[];
}

// Country code to full name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada',
  'AU': 'Australia', 'DE': 'Germany', 'FR': 'France', 'NP': 'Nepal', 'BD': 'Bangladesh',
  'PK': 'Pakistan', 'AE': 'UAE', 'SG': 'Singapore', 'MY': 'Malaysia', 'ID': 'Indonesia',
  'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'JP': 'Japan', 'KR': 'South Korea',
  'CN': 'China', 'BR': 'Brazil', 'MX': 'Mexico', 'SA': 'Saudi Arabia', 'QA': 'Qatar',
  'KW': 'Kuwait', 'OM': 'Oman', 'BH': 'Bahrain', 'LK': 'Sri Lanka', 'MM': 'Myanmar',
  'NZ': 'New Zealand', 'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya', 'EG': 'Egypt',
  'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'BE': 'Belgium', 'SE': 'Sweden',
  'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland', 'RU': 'Russia',
  'UA': 'Ukraine', 'TR': 'Turkey', 'IL': 'Israel', 'IE': 'Ireland', 'PT': 'Portugal',
  'CH': 'Switzerland', 'AT': 'Austria', 'CZ': 'Czech Republic', 'GR': 'Greece', 'HU': 'Hungary',
};

const getCountryName = (code: string): string => {
  if (!code) return 'Unknown';
  // Already a full name
  if (code.length > 3) return code;
  return COUNTRY_NAMES[code.toUpperCase()] || code;
};

const GlobalAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [serverData, setServerData] = useState<ServerAnalytics | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const { user } = useAuth();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, user?.id]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch both links data and server-side aggregations in parallel
      const [links, fullAnalytics] = await Promise.all([
        supabaseAdapter.getLinks(),
        user?.id ? aggregatedAnalytics.getFullAnalytics(user.id) : null
      ]);

      // Process client-side data (for map visualization)
      const summary = processAnalytics(links);
      setAnalytics(summary);

      // Store server-side accurate data
      if (fullAnalytics) {
        setServerData(fullAnalytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalytics = (links: LinkData[]): AnalyticsSummary => {
    const allClicks: ClickEvent[] = [];
    links.forEach(link => {
      allClicks.push(...(link.clickHistory || []));
    });

    const now = Date.now();
    const rangeMs = dateRange === '7d' ? 7 * 24 * 60 * 60 * 1000
      : dateRange === '30d' ? 30 * 24 * 60 * 60 * 1000
        : 90 * 24 * 60 * 60 * 1000;
    const filteredClicks = allClicks.filter(c => now - c.timestamp < rangeMs);


    const countryMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const country = c.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const topCountries = Array.from(countryMap.entries())
      .map(([country, clicks]) => ({ country, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Process Top Cities
    const cityMap = new Map<string, { count: number; country: string }>();
    filteredClicks.forEach(c => {
      if (c.city) {
        const key = `${c.city}, ${c.country || ''}`;
        const current = cityMap.get(key) || { count: 0, country: c.country || '' };
        cityMap.set(key, { count: current.count + 1, country: current.country });
      }
    });
    const topCities = Array.from(cityMap.entries())
      .map(([key, data]) => ({ city: key.split(',')[0], country: data.country, clicks: data.count }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const deviceMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const device = c.device || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const topDevices = Array.from(deviceMap.entries())
      .map(([device, clicks]) => ({ device, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    const browserMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const browser = c.browser || 'Unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    const topBrowsers = Array.from(browserMap.entries())
      .map(([browser, clicks]) => ({ browser, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const dayMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });
    const clicksByDay = Array.from(dayMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process UTM Sources
    const sourceMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      if (c.utm_source) {
        sourceMap.set(c.utm_source, (sourceMap.get(c.utm_source) || 0) + 1);
      }
    });
    const topSources = Array.from(sourceMap.entries())
      .map(([source, clicks]) => ({ source, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Process UTM Campaigns
    const campaignMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      if (c.utm_campaign) {
        campaignMap.set(c.utm_campaign, (campaignMap.get(c.utm_campaign) || 0) + 1);
      }
    });
    const topCampaigns = Array.from(campaignMap.entries())
      .map(([campaign, clicks]) => ({ campaign, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Process Trigger Source (QR vs Link)
    const triggerMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const source = c.trigger_source === 'qr' ? 'QR Code' : 'Direct Link';
      triggerMap.set(source, (triggerMap.get(source) || 0) + 1);
    });
    const triggerSource = Array.from(triggerMap.entries())
      .map(([source, clicks]) => ({ source, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    // Process Heatmap Data (Day of Week + Hour)
    const heatmapMap = new Map<string, number>();
    filteredClicks.forEach(c => {
      const date = new Date(c.timestamp);
      const day = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      const key = `${day}-${hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });
    const heatmapData = Array.from(heatmapMap.entries()).map(([key, clicks]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, clicks };
    });

    return {
      totalClicks: filteredClicks.length,
      totalLinks: links.length,
      uniqueCountries: countryMap.size,
      topCountries,
      topCities,
      topDevices,
      topBrowsers,
      clicksByDay,
      recentClicks: filteredClicks.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 10),
      topSources,
      topCampaigns,
      triggerSource,
      heatmapData,
      filteredClicks, // Pass the full dataset
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Use server data for accurate counts, client data for max bar width calculations
  const topCountries = serverData?.countries || [];
  const topCities = serverData?.cities || [];
  const topDevices = serverData?.devices || [];
  const topReferrers = serverData?.referrers || [];
  const topBrowsers = serverData?.browsers || [];
  const maxClicks = Math.max(...(topCountries.map(c => c.clickCount) || [1]));

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Global Analytics</h1>
            <p className="text-stone-500 text-sm mt-1">Aggregated insights across all your links</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range ? 'bg-yellow-100 text-slate-900' : 'text-stone-500 hover:text-slate-900'
                  }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Live Global Map */}
        <div className="w-full">
          <LiveWorldMap clickHistory={analytics?.filteredClicks || []} serverCityData={topCities} />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MousePointer2 className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-stone-500 text-sm">Total Clicks</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{(serverData?.stats?.totalClicks ?? analytics?.totalClicks ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-stone-500 text-sm">Active Links</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics?.totalLinks}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-stone-500 text-sm">Countries</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{topCountries.length || analytics?.uniqueCountries}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-stone-500 text-sm">Avg/Day</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {serverData?.stats?.clicksThisWeek ? Math.round(serverData.stats.clicksThisWeek / 7) : (analytics?.clicksByDay.length ? Math.round(analytics.totalClicks / analytics.clicksByDay.length) : 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-emerald-500" />
              <h3 className="text-slate-900 font-bold">Top Countries</h3>
            </div>
            <div className="space-y-4">
              {topCountries.length === 0 ? (
                <p className="text-stone-500 text-sm">No data yet</p>
              ) : (
                topCountries.slice(0, 5).map((item, i) => (
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
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-cyan-500" />
              <h3 className="text-slate-900 font-bold">Top Cities</h3>
            </div>
            <div className="space-y-4">
              {topCities.length === 0 ? (
                <p className="text-stone-500 text-sm">No data yet</p>
              ) : (
                topCities.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-stone-400 text-sm w-4">{i + 1}</span>
                      <div>
                        <p className="text-slate-900 text-sm font-medium">{item.city}</p>
                        <p className="text-stone-500 text-xs">{item.country}</p>
                      </div>
                    </div>
                    <span className="text-stone-500 text-sm">{item.clickCount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>


          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Monitor className="w-5 h-5 text-indigo-500" />
              <h3 className="text-slate-900 font-bold">Devices</h3>
            </div>
            <div className="space-y-4">
              {topDevices.length === 0 ? (
                <p className="text-stone-500 text-sm">No data yet</p>
              ) : (
                topDevices.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      {item.device.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Monitor className="w-4 h-4 text-indigo-500" />
                      )}
                      <span className="text-slate-900 text-sm">{item.device}</span>
                    </div>
                    <span className="text-stone-500 text-sm">{item.clickCount.toLocaleString()} clicks</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Advanced Analytics: Campaigns & Sources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* UTM Campaigns */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              <h3 className="text-slate-900 font-bold">Top Campaigns</h3>
            </div>
            <div className="space-y-4">
              {analytics?.topCampaigns.length === 0 ? (
                <p className="text-stone-500 text-sm">No campaign data yet</p>
              ) : (
                analytics?.topCampaigns.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <span className="text-slate-900 text-sm truncate max-w-[150px]" title={item.campaign}>{item.campaign}</span>
                    <span className="text-stone-500 text-sm">{item.clicks}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* UTM Sources */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-orange-500" />
              <h3 className="text-slate-900 font-bold">Top Sources</h3>
            </div>
            <div className="space-y-4">
              {analytics?.topSources.length === 0 ? (
                <p className="text-stone-500 text-sm">No source data yet</p>
              ) : (
                analytics?.topSources.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <span className="text-slate-900 text-sm truncate max-w-[150px]" title={item.source}>{item.source}</span>
                    <span className="text-stone-500 text-sm">{item.clicks}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-purple-500" />
              <h3 className="text-slate-900 font-bold">Traffic Type</h3>
            </div>
            <div className="space-y-4">
              {topReferrers.length === 0 ? (
                <p className="text-stone-500 text-sm">No data yet</p>
              ) : (
                topReferrers.map((item, i) => {
                  const total = topReferrers.reduce((sum, r) => sum + r.clickCount, 0);
                  const percentage = Math.round((item.clickCount / total) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900 text-sm">{item.referrer}</span>
                        <span className="text-stone-500 text-sm">{item.clickCount.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Engagement Heatmap */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-400 to-orange-400" />
            <h3 className="text-slate-900 font-bold">Engagement Heatmap (UTC)</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[auto_repeat(24,1fr)] gap-1">
                {/* Hours Header */}
                <div className="h-8" /> {/* Spacer for row labels */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="text-xs text-stone-400 text-center">{i}</div>
                ))}

                {/* Days Rows */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                  <React.Fragment key={day}>
                    <div className="text-xs text-stone-500 flex items-center h-8">{day}</div>
                    {Array.from({ length: 24 }).map((_, hourIndex) => {
                      const dataPoint = analytics?.heatmapData.find(d => d.day === dayIndex && d.hour === hourIndex);
                      const count = dataPoint?.clicks || 0;
                      const maxClicks = Math.max(...(analytics?.heatmapData.map(d => d.clicks) || [1]));
                      const intensity = count > 0 ? Math.max(0.2, count / maxClicks) : 0;

                      return (
                        <div
                          key={`${dayIndex}-${hourIndex}`}
                          className={`h-8 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-yellow-400 relative group ${count > 0 ? 'bg-yellow-400' : 'bg-stone-100'}`}
                          style={{ opacity: count > 0 ? intensity : 1 }}
                          title={`${day} ${hourIndex}:00 - ${count} clicks`}
                        >
                          {count > 0 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none border border-white/10">
                              {count} clicks
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-cyan-500" />
            <h3 className="text-slate-900 font-bold">Top Browsers</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topBrowsers.length === 0 ? (
              <p className="text-stone-500 text-sm col-span-5">No data yet</p>
            ) : (
              topBrowsers.slice(0, 5).map((item, i) => (
                <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                  <p className="text-slate-900 font-bold text-lg">{item.clickCount.toLocaleString()}</p>
                  <p className="text-stone-500 text-sm">{item.browser}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-slate-900 font-bold mb-4">Recent Clicks</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-stone-500 text-sm border-b border-stone-100">
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Device</th>
                  <th className="pb-3 font-medium">Browser</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentClicks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-stone-500 text-sm">No clicks recorded yet</td>
                  </tr>
                ) : (
                  analytics?.recentClicks.map((click, i) => (
                    <tr key={i} className="border-b border-stone-100 last:border-0">
                      <td className="py-3 text-slate-700 text-sm">{new Date(click.timestamp).toLocaleString()}</td>
                      <td className="py-3 text-slate-700 text-sm">{click.country || 'Unknown'}</td>
                      <td className="py-3 text-slate-700 text-sm">{click.device || 'Unknown'}</td>
                      <td className="py-3 text-slate-700 text-sm">{click.browser || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAnalytics;
