export interface ClickEvent {
  timestamp: number;
  referrer: string;
  device: 'Mobile' | 'Desktop' | 'Tablet' | 'Other' | string;
  os: 'iOS' | 'Android' | 'Windows' | 'MacOS' | 'Linux' | 'Other' | string;
  country?: string;
  // Enhanced analytics fields
  browser?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  screenWidth?: number;
  screenHeight?: number;
  timezone?: string;
  language?: string;
  fingerprint?: string;
  // Marketing analytics
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  trigger_source?: 'link' | 'qr' | string;
}

export interface SmartRedirects {
  ios?: string;
  android?: string;
  desktop?: string;
}

// Link category type for color-coded performance cards
export type LinkCategory = 'social' | 'marketing' | 'product' | 'other';

export interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;

  // Category for dashboard display
  category?: LinkCategory;

  // Analytics
  clicks: number;
  lastClickedAt?: number;
  clickHistory: ClickEvent[];

  // Advanced Config
  smartRedirects?: SmartRedirects;
  geoRedirects?: Record<string, string>; // e.g. { 'US': '...', 'IN': '...' }
  expirationDate?: number | null;
  maxClicks?: number | null;
  password?: string | null;

  qrCodeData?: string;
  aiAnalysis?: {
    sentiment: string;
    category: string;
    predictedEngagement: 'High' | 'Medium' | 'Low';
  };
}

// Category color mapping for consistent styling across components
export const CATEGORY_COLORS: Record<LinkCategory, string> = {
  social: '#00d4ff',    // cyan
  marketing: '#ffd700', // yellow
  product: '#ff6b6b',   // coral
  other: '#1a1a2e',     // dark
};

// Helper function to categorize links based on URL patterns or tags
export function categorizeLink(link: LinkData): LinkCategory {
  // If category is already set, return it
  if (link.category) {
    return link.category;
  }

  const url = link.originalUrl.toLowerCase();
  const tags = link.tags.map(t => t.toLowerCase());
  const title = link.title.toLowerCase();

  // Social media patterns
  const socialPatterns = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'social'];
  if (socialPatterns.some(p => url.includes(p) || tags.includes(p) || title.includes(p))) {
    return 'social';
  }

  // Marketing patterns
  const marketingPatterns = ['campaign', 'promo', 'marketing', 'ads', 'utm_', 'newsletter', 'email'];
  if (marketingPatterns.some(p => url.includes(p) || tags.includes(p) || title.includes(p))) {
    return 'marketing';
  }

  // Product patterns
  const productPatterns = ['product', 'shop', 'store', 'buy', 'pricing', 'checkout', 'cart'];
  if (productPatterns.some(p => url.includes(p) || tags.includes(p) || title.includes(p))) {
    return 'product';
  }

  return 'other';
}

// Get category color for a link
export function getCategoryColor(category: LinkCategory): string {
  return CATEGORY_COLORS[category];
}

export interface BioProfile {
  id: string;
  handle: string; // unique slug
  displayName: string;
  bio: string;
  avatarUrl: string;
  theme: 'dark' | 'light' | 'blue' | 'purple';
  links: string[]; // Array of LinkData IDs
  views: number;
}

export interface AnalyticsData {
  date: string;
  clicks: number;
}

export interface DeviceData {
  name: string;
  value: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LINKS = 'LINKS',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  API = 'API',
  BIO_PAGES = 'BIO_PAGES',
  PRODUCTS = 'PRODUCTS',
  STOREFRONT = 'STOREFRONT'
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  linkId: string; // Links to LinkData for tracking
  createdAt: number;
}


// ============================================
// Chart Data Types for Dashboard UI Redesign
// ============================================

// Click Forecast Chart data point (bar chart with forecast vs actual)
export interface ClickForecastDataPoint {
  day: string;
  forecast: number;
  actual: number;
}

// Traffic Source Chart data point (donut chart)
export interface TrafficSourceDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// Link Health Chart data point (radar chart)
export interface LinkHealthDataPoint {
  metric: string;
  value: number; // 0-100 scale
  [key: string]: string | number;
}

// Traffic source type for consistent categorization
export type TrafficSource = 'direct' | 'social' | 'referral';

// Traffic source color mapping
export const TRAFFIC_SOURCE_COLORS: Record<TrafficSource, string> = {
  direct: '#00d4ff',   // cyan
  social: '#a855f7',   // purple
  referral: '#ff6b6b', // coral
};

// ============================================
// Data Processing Functions
// ============================================

// Generate click forecast data from link click history
export function generateClickForecastData(links: LinkData[]): ClickForecastDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayClickCounts: Record<string, number> = {};

  // Initialize counts
  days.forEach(day => {
    dayClickCounts[day] = 0;
  });

  // Aggregate clicks by day of week
  links.forEach(link => {
    link.clickHistory.forEach(click => {
      const date = new Date(click.timestamp);
      const dayIndex = date.getDay();
      // Convert Sunday (0) to end of week
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1];
      dayClickCounts[dayName]++;
    });
  });

  // Generate forecast (simple average-based projection with slight variation)
  const totalClicks = Object.values(dayClickCounts).reduce((sum, count) => sum + count, 0);
  const avgClicks = totalClicks / 7;

  return days.map(day => ({
    day,
    actual: dayClickCounts[day],
    forecast: Math.round(avgClicks * (0.8 + Math.random() * 0.4)), // ±20% variation
  }));
}

// Generate traffic source data from link click history
export function generateTrafficSourceData(links: LinkData[]): TrafficSourceDataPoint[] {
  const sourceCounts: Record<TrafficSource, number> = {
    direct: 0,
    social: 0,
    referral: 0,
  };

  // Categorize clicks by referrer
  links.forEach(link => {
    link.clickHistory.forEach(click => {
      const referrer = click.referrer.toLowerCase();

      if (!referrer || referrer === 'direct' || referrer === '') {
        sourceCounts.direct++;
      } else if (
        referrer.includes('twitter') ||
        referrer.includes('facebook') ||
        referrer.includes('instagram') ||
        referrer.includes('linkedin') ||
        referrer.includes('tiktok')
      ) {
        sourceCounts.social++;
      } else {
        sourceCounts.referral++;
      }
    });
  });

  return [
    { name: 'Direct', value: sourceCounts.direct, color: TRAFFIC_SOURCE_COLORS.direct },
    { name: 'Social', value: sourceCounts.social, color: TRAFFIC_SOURCE_COLORS.social },
    { name: 'Referral', value: sourceCounts.referral, color: TRAFFIC_SOURCE_COLORS.referral },
  ];
}

// Calculate total from traffic source data
export function calculateTrafficSourceTotal(data: TrafficSourceDataPoint[]): number {
  return data.reduce((sum, source) => sum + source.value, 0);
}

// Generate link health data from links
export function generateLinkHealthData(links: LinkData[]): LinkHealthDataPoint[] {
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

// Get top performing links by click count
export function getTopPerformingLinks(links: LinkData[], limit: number = 4): LinkData[] {
  return [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}
