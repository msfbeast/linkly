/**
 * Analytics Service
 * 
 * Handles data aggregation, transformation, and business logic for analytics display.
 * Implements date filtering, click aggregation, and traffic source categorization.
 */

import { ClickEvent, LinkData, ClickForecastDataPoint, TrafficSourceDataPoint, LinkHealthDataPoint, TRAFFIC_SOURCE_COLORS, TrafficSource } from '../types';

// Date range type for filtering
export type DateRange = '7d' | '30d' | '90d' | 'all';

/**
 * Converts a DateRange to milliseconds offset from now
 */
export function dateRangeToMs(range: DateRange): number | null {
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
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
    day,
    actual: dayClickCounts[day],
    // Forecast is the historical average (no random variation)
    forecast: Math.round(avgClicks),
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
  const normalizedReferrer = referrer.toLowerCase().trim();
  
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

/**
 * Gets top performing links by click count
 * 
 * @param links - Array of links to sort
 * @param limit - Maximum number of links to return
 * @returns Array of top performing links
 */
export function getTopPerformingLinks(links: LinkData[], limit: number = 4): LinkData[] {
  return [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}
