/**
 * Analytics Service
 * 
 * Handles data aggregation, transformation, and business logic for analytics display.
 * Implements date filtering, click aggregation, and traffic source categorization.
 */

import { ClickEvent, LinkData, ClickForecastDataPoint, TrafficSourceDataPoint, LinkHealthDataPoint, TRAFFIC_SOURCE_COLORS, TrafficSource, DeviceData, DailyClicks, ReferrerBreakdown } from '../types';

// Date range type for filtering
export type DateRange = '24h' | '7d' | '30d' | '90d' | 'all';

/**
 * Converts a DateRange to milliseconds offset from now
 */
export function dateRangeToMs(range: DateRange): number | null {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  switch (range) {
    case '24h':
      return 24 * hour;
    case '7d':
      return 7 * day;
    case '30d':
      return 30 * day;
    case '90d':
      return 90 * day;
    case 'all':
      return null; // No limit
  }
}

/**
 * Filters click events by date range
 * 
 * **Validates: Requirements 4.4**
 * WHEN aggregating data THEN the Analytics System SHALL support filtering by date range
 * 
 * @param events - Array of click events to filter
 * @param range - Date range to filter by ('7d', '30d', '90d', 'all')
 * @param referenceTime - Optional reference time (defaults to now), useful for testing
 * @returns Filtered array of click events within the date range
 */
export function filterByDateRange(
  events: ClickEvent[],
  range: DateRange,
  referenceTime: number = Date.now()
): ClickEvent[] {
  const rangeMs = dateRangeToMs(range);

  // 'all' range returns all events
  if (rangeMs === null) {
    return events;
  }

  const startTime = referenceTime - rangeMs;

  return events.filter(event => event.timestamp >= startTime && event.timestamp <= referenceTime);
}


/**
 * Aggregates click events by day of week
 * 
 * **Validates: Requirements 4.1**
 * WHEN a user views the Click Forecast chart THEN the Analytics System SHALL
 * aggregate actual click data by day of week
 * 
 * @param events - Array of click events to aggregate
 * @returns Array of click counts per day of week
 */
export function aggregateClicksByDayOfWeek(events: ClickEvent[]): Record<string, number> {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayClickCounts: Record<string, number> = {};

  // Initialize all days with zero
  days.forEach(day => {
    dayClickCounts[day] = 0;
  });

  // Aggregate clicks by day of week
  events.forEach(event => {
    const date = new Date(event.timestamp);
    const dayIndex = date.getDay();
    // Convert Sunday (0) to end of week, Monday (1) to start
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
    dayClickCounts[dayName]++;
  });

  return dayClickCounts;
}

/**
 * Generates click forecast data from link click history using real data only
 * 
 * **Validates: Requirements 4.1**
 * Uses actual historical averages instead of random forecast generation
 * 
 * @param links - Array of links with click history
 * @param dateRange - Optional date range to filter clicks
 * @returns Array of ClickForecastDataPoint for chart display
 */
export function generateClickForecastData(
  links: LinkData[],
  dateRange: DateRange = 'all'
): ClickForecastDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Collect all click events from all links
  const allEvents: ClickEvent[] = [];
  links.forEach(link => {
    allEvents.push(...link.clickHistory);
  });

  // Filter by date range
  const filteredEvents = filterByDateRange(allEvents, dateRange);

  // Aggregate by day of week
  const dayClickCounts = aggregateClicksByDayOfWeek(filteredEvents);

  // Calculate forecast based on historical average
  const totalClicks = Object.values(dayClickCounts).reduce((sum, count) => sum + count, 0);
  const avgClicks = totalClicks / 7;

  // Generate data points with actual data and forecast based on historical average
  return days.map(day => ({
    date: day,
    actual: dayClickCounts[day],
    // Forecast is the historical average (no random variation)
    forecast: Math.round(avgClicks),
  }));
}

/**
 * Converts aggregated DailyClicks[] to ClickForecastDataPoint[]
 * 
 * **Optimization**: Used by Dashboard to avoid client-side aggregation
 */
export function aggregateDailyClicksToForecast(dailyClicks: DailyClicks[]): ClickForecastDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Initialize aggregated map
  const dayClickCounts: Record<string, number> = {};
  days.forEach(day => dayClickCounts[day] = 0);

  // Aggregate
  dailyClicks.forEach(item => {
    const date = new Date(item.date);
    const dayIndex = date.getDay();
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Shift Sunday to end
    dayClickCounts[dayName] += item.clickCount;
  });

  const totalClicks = Object.values(dayClickCounts).reduce((sum, count) => sum + count, 0);
  const avgClicks = totalClicks / 7;

  return days.map(day => ({
    date: day,
    actual: dayClickCounts[day],
    forecast: Math.round(avgClicks)
  }));
}


/**
 * Categorizes a referrer string into a traffic source category
 * 
 * **Validates: Requirements 4.2**
 * Every referrer maps to exactly one category from {Direct, Social, Referral}
 * 
 * @param referrer - The referrer URL string
 * @returns The traffic source category
 */
export function categorizeReferrer(referrer: string): TrafficSource {
  const normalizedReferrer = (referrer || '').toLowerCase().trim();

  // Direct traffic: empty, null, or explicitly "direct"
  if (!normalizedReferrer || normalizedReferrer === 'direct') {
    return 'direct';
  }

  // Social media patterns
  const socialPatterns = [
    'twitter',
    't.co',
    'facebook',
    'fb.com',
    'instagram',
    'linkedin',
    'tiktok',
    'youtube',
    'youtu.be',
    'pinterest',
    'reddit',
    'snapchat',
    'whatsapp',
    'telegram',
    'discord',
    'tumblr',
    'mastodon',
    'threads.net',
  ];

  if (socialPatterns.some(pattern => normalizedReferrer.includes(pattern))) {
    return 'social';
  }

  // Everything else is referral traffic
  return 'referral';
}

/**
 * Generates traffic source data from link click history
 * 
 * **Validates: Requirements 4.2**
 * WHEN a user views the Traffic Source chart THEN the Analytics System SHALL
 * categorize clicks by referrer into Direct, Social, and Referral
 * 
 * @param links - Array of links with click history
 * @param dateRange - Optional date range to filter clicks
 * @returns Array of TrafficSourceDataPoint for chart display
 */
export function generateTrafficSourceData(
  links: LinkData[],
  dateRange: DateRange = 'all'
): TrafficSourceDataPoint[] {
  const sourceCounts: Record<TrafficSource, number> = {
    direct: 0,
    social: 0,
    referral: 0,
  };

  // Collect all click events from all links
  const allEvents: ClickEvent[] = [];
  links.forEach(link => {
    allEvents.push(...link.clickHistory);
  });

  // Filter by date range
  const filteredEvents = filterByDateRange(allEvents, dateRange);

  // Categorize each click by referrer
  filteredEvents.forEach(event => {
    const category = categorizeReferrer(event.referrer);
    sourceCounts[category]++;
  });

  return [
    { name: 'Direct', value: sourceCounts.direct, color: TRAFFIC_SOURCE_COLORS.direct },
    { name: 'Social', value: sourceCounts.social, color: TRAFFIC_SOURCE_COLORS.social },
    { name: 'Referral', value: sourceCounts.referral, color: TRAFFIC_SOURCE_COLORS.referral },
  ];
}

/**
 * Converts ReferrerBreakdown[] to TrafficSourceDataPoint[]
 * 
 * **Optimization**: Used by Dashboard to avoid client-side categorization of thousands of events
 */
export function categorizeTrafficSourceFromStats(referrers: ReferrerBreakdown[]): TrafficSourceDataPoint[] {
  const sourceCounts: Record<TrafficSource, number> = {
    direct: 0,
    social: 0,
    referral: 0,
  };

  referrers.forEach(item => {
    const category = categorizeReferrer(item.referrer);
    sourceCounts[category] += item.clickCount;
  });

  return [
    { name: 'Direct', value: sourceCounts.direct, color: TRAFFIC_SOURCE_COLORS.direct },
    { name: 'Social', value: sourceCounts.social, color: TRAFFIC_SOURCE_COLORS.social },
    { name: 'Referral', value: sourceCounts.referral, color: TRAFFIC_SOURCE_COLORS.referral },
  ];
}

/**
 * Calculates total from traffic source data
 * 
 * @param data - Array of traffic source data points
 * @returns Total click count
 */
export function calculateTrafficSourceTotal(data: TrafficSourceDataPoint[]): number {
  return data.reduce((sum, source) => sum + source.value, 0);
}


/**
 * Generates link health data from links
 * 
 * **Validates: Requirements 3.2, 4.5**
 * WHEN charts have no data THEN the Analytics System SHALL display appropriate
 * empty states with zero values
 * 
 * @param links - Array of links to analyze
 * @returns Array of LinkHealthDataPoint for radar chart display
 */
export function generateLinkHealthData(links: LinkData[]): LinkHealthDataPoint[] {
  // Return zero values for empty input
  if (links.length === 0) {
    return [
      { metric: 'CTR', value: 0 },
      { metric: 'Engagement', value: 0 },
      { metric: 'Reach', value: 0 },
      { metric: 'Retention', value: 0 },
      { metric: 'Growth', value: 0 },
    ];
  }

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const avgClicks = totalClicks / links.length;
  const maxClicks = Math.max(...links.map(link => link.clicks));

  // Calculate metrics (normalized to 0-100 scale)
  const ctr = Math.min(100, (avgClicks / 100) * 100); // Assume 100 clicks is 100% CTR baseline

  // Engagement: based on click frequency
  const recentClicks = links.filter(link =>
    link.lastClickedAt && Date.now() - link.lastClickedAt < 7 * 24 * 60 * 60 * 1000
  ).length;
  const engagement = (recentClicks / links.length) * 100;

  // Reach: based on total clicks relative to max
  const reach = maxClicks > 0 ? (totalClicks / (maxClicks * links.length)) * 100 : 0;

  // Retention: based on links with multiple clicks
  const linksWithMultipleClicks = links.filter(link => link.clicks > 1).length;
  const retention = (linksWithMultipleClicks / links.length) * 100;

  // Growth: based on recent vs older clicks
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let recentClickCount = 0;
  let olderClickCount = 0;

  links.forEach(link => {
    link.clickHistory.forEach(click => {
      if (click.timestamp > weekAgo) {
        recentClickCount++;
      } else {
        olderClickCount++;
      }
    });
  });

  const growth = olderClickCount > 0
    ? Math.min(100, (recentClickCount / olderClickCount) * 50)
    : (recentClickCount > 0 ? 100 : 0);

  return [
    { metric: 'CTR', value: Math.round(ctr) },
    { metric: 'Engagement', value: Math.round(engagement) },
    { metric: 'Reach', value: Math.round(reach) },
    { metric: 'Retention', value: Math.round(retention) },
    { metric: 'Growth', value: Math.round(growth) },
  ];
}

export function getTopPerformingLinks(links: LinkData[], limit: number = 4): LinkData[] {
  return [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

/**
 * Generates distribution data for a specific field
 */
export function generateDistributionData(
  events: ClickEvent[],
  field: keyof ClickEvent,
  limit: number = 5
): DeviceData[] {
  const counts: Record<string, number> = {};

  events.forEach(event => {
    const value = String(event[field] || 'Unknown');
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function generateDeviceTypeData(events: ClickEvent[]): DeviceData[] {
  return generateDistributionData(events, 'device');
}

export function generateOSVersionData(events: ClickEvent[]): DeviceData[] {
  return generateDistributionData(events, 'osVersion');
}

export function generateBrowserVersionData(events: ClickEvent[]): DeviceData[] {
  return generateDistributionData(events, 'browserVersion');
}

export function generateScreenResolutionData(events: ClickEvent[]): DeviceData[] {
  // Custom handling for screen resolution to format it nicely
  const counts: Record<string, number> = {};

  events.forEach(event => {
    const width = event.screenWidth;
    const height = event.screenHeight;
    const value = width && height ? `${width}x${height}` : 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

/**
 * Fetches link stats, using summary table for historical data if available
 * 
 * @param linkId - ID of the link to fetch stats for
 * @param dateRange - Date range filter
 */
export async function getLinkStats(linkId: string, dateRange: DateRange) {
  // This function would ideally be implemented in supabaseAdapter
  // but we'll define the logic here for now.

  // Logic:
  // 1. If range is 'today' or < 24h, query raw click_events
  // 2. If range is > 24h, query analytics_daily_summary
  // 3. Combine with today's raw events for real-time accuracy

  // For now, we are keeping the existing client-side aggregation 
  // until the backend function is fully deployed and accessible.
  // This placeholder prepares the service for the switch.

  return null;
}
/**
 * Processes click events into a heatmap grid (7 days x 24 hours)
 * 
 * @param events - Array of click events
 * @returns Array of 7 day objects, each containing 24 hour counts
 */
export function processHeatmapData(events: ClickEvent[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Initialize grid: 7 days x 24 hours
  const heatmapData = days.map(day => ({
    day,
    hours: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
  }));

  events.forEach(event => {
    const date = new Date(event.timestamp);
    const dayIndex = date.getDay(); // 0 (Sun) - 6 (Sat)
    const hour = date.getHours(); // 0 - 23

    heatmapData[dayIndex].hours[hour].count++;
  });

  return heatmapData;
}
