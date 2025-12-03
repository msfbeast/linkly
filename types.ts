export interface ClickEvent {
  timestamp: number;
  referrer: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser?: string;
  country: string;
  // Enhanced analytics fields
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  timezone?: string;
  // Marketing analytics
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  trigger_source?: 'link' | 'qr' | string;
  // Advanced Analytics
  browserVersion?: string;
  osVersion?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  visitorId?: string;
  fingerprint?: string;
  destinationUrl?: string; // For A/B testing tracking
}

export interface SmartRedirects {
  ios?: string;
  android?: string;
  desktop?: string;
}

// Link category type for color-coded performance cards
export type LinkCategory = 'social' | 'marketing' | 'product' | 'other';

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
  createdAt: number;
}

export interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  description?: string;
  tags: string[];
  folderId?: string | null;
  teamId?: string | null;
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
  startDate?: number | null;
  expirationDate?: number | null;
  maxClicks?: number | null;
  password?: string | null;

  qrCodeData?: string;
  aiAnalysis?: {
    sentiment: string;
    category: string;
    predictedEngagement: 'High' | 'Medium' | 'Low';
  };
  abTestConfig?: {
    enabled: boolean;
    variants: {
      id: string;
      url: string;
      weight: number; // Percentage 0-100
    }[];
  };

  // Guest Link Fields
  isGuest?: boolean;
  claimToken?: string;
  expiresAt?: number;
}

// Category color mapping for consistent styling across components
export const CATEGORY_COLORS: Record<LinkCategory, string> = {
  social: '#06b6d4',    // cyan-500
  marketing: '#facc15', // yellow-400
  product: '#f59e0b',   // amber-500 (replaced pink)
  other: '#78716c',     // stone-500
};

// Helper function to categorize links based on URL patterns or tags
export function categorizeLink(link: LinkData): LinkCategory {
  // If category is already set, return it
  if (link.category) {
    return link.category;
  }

  const url = (link.originalUrl || '').toLowerCase();
  const tags = (link.tags || []).map(t => t.toLowerCase());
  const title = (link.title || '').toLowerCase();

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

export interface BioThemeConfig {
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundValue: string;
  textColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill' | 'shadow' | 'outline' | 'hard-shadow';
  buttonColor: string;
  buttonTextColor: string;
  font: 'inter' | 'roboto' | 'lora' | 'poppins' | 'space-mono' | 'outfit';
}

export interface BioProfile {
  id: string;
  userId: string;
  handle: string; // unique slug
  displayName: string;
  bio: string;
  avatarUrl: string;
  theme: 'vibrant' | 'glass' | 'industrial' | 'retro' | 'cyberpunk' | 'neubrutalism' | 'lofi' | 'clay' | 'bauhaus' | 'lab' | 'archive' | 'dark' | 'light' | 'blue' | 'purple';
  links: string[]; // Array of LinkData IDs
  views: number;
  customTheme?: BioThemeConfig;
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
  TEAM_SETTINGS = 'TEAM_SETTINGS',
  PRODUCTS = 'PRODUCTS',
  STOREFRONT = 'STOREFRONT'
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  ownerId: string;
  createdAt: number;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: number;
  // Joined fields
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: Exclude<TeamRole, 'owner'>;
  token: string;
  expiresAt: number;
  createdAt: number;
  createdBy: string;
}

export type StorefrontTheme = 'vibrant' | 'glass' | 'industrial' | 'retro' | 'cyberpunk' | 'neubrutalism' | 'lofi' | 'clay' | 'bauhaus' | 'lab' | 'archive' | 'dark' | 'light' | 'blue' | 'purple';

export interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  website?: string;
  updatedAt?: string;

  // Settings
  settingsNotifications: {
    email: boolean;
    milestones: boolean;
    reports: boolean;
    security: boolean;
  };

  // Monetization
  flipkartAffiliateId?: string;
  amazonAssociateTag?: string;

  // Storefront
  storefrontTheme?: StorefrontTheme;
  storeName?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  upiId?: string;


  // Onboarding
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  onboardingSkipped?: boolean;
  onboardingStartedAt?: string;
  subscription_tier?: 'free' | 'starter' | 'pro' | 'premium' | 'business';
  subscription_status?: 'active' | 'trial' | 'past_due' | 'canceled';
  trial_ends_at?: string;
  razorpay_customer_id?: string;
  razorpay_subscription_id?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: number;
  expiresAt?: number;
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    email_notifications?: boolean;
    onboarding_completed?: boolean;
    onboarding_step?: number;
    onboarding_skipped?: boolean;
    onboarding_started_at?: string;
    subscription_tier?: 'free' | 'starter' | 'pro' | 'premium' | 'business';
    subscription_status?: 'active' | 'trial' | 'past_due' | 'canceled';
    trial_ends_at?: string;
  };
  role?: 'user' | 'admin' | 'super_admin';
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
  shortCode?: string; // For direct linking from storefront
  originalUrl?: string; // For direct linking fallback
  category?: string;
  slug?: string;
  createdAt: number;
}

export type DomainStatus = 'pending' | 'active' | 'failed';

export interface Domain {
  id: string;
  userId: string;
  domain: string;
  status: DomainStatus;
  verificationToken: string;
  targetType: 'bio' | 'store';
  createdAt: number;
  verifiedAt?: number;
}

export interface GalleryItem {
  id: string;
  userId: string;
  url: string;
  caption?: string;
  exifData?: {
    make?: string;
    model?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: number;
    focalLength?: number;
    lensModel?: string;
    createDate?: string;
  };
  width?: number;
  height?: number;
  sortOrder: number;
  createdAt: number;
}

export interface NewsletterSubscriber {
  id: string;
  userId: string;
  email: string;
  createdAt: number;
}


// ============================================
// Chart Data Types for Dashboard UI Redesign
// ============================================

// Click Forecast Chart data point (bar chart with forecast vs actual)
export interface ClickForecastDataPoint {
  date: string;
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
    date: day,
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
      { metric: 'Avg Clicks', value: 0 },
      { metric: 'Engagement', value: 0 },
      { metric: 'Reach', value: 0 },
      { metric: 'Retention', value: 0 },
      { metric: 'Growth', value: 0 },
    ];
  }

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const avgClicks = totalClicks / links.length;

  // Engagement: % of links active in the last 7 days
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const activeLinksCount = links.filter(link =>
    link.lastClickedAt && link.lastClickedAt > weekAgo
  ).length;
  const engagement = (activeLinksCount / links.length) * 100;

  // Reach: Unique visitors (fingerprints)
  const uniqueVisitors = new Set<string>();
  links.forEach(link => {
    link.clickHistory.forEach(click => {
      if (click.fingerprint) uniqueVisitors.add(click.fingerprint);
      else if (click.visitorId) uniqueVisitors.add(click.visitorId);
    });
  });
  const reach = uniqueVisitors.size;

  // Retention: % of links with > 1 click (simple proxy for now)
  const linksWithMultipleClicks = links.filter(link => link.clicks > 1).length;
  const retention = (linksWithMultipleClicks / links.length) * 100;

  // Growth: Week-over-week click growth
  let currentWeekClicks = 0;
  let previousWeekClicks = 0;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  links.forEach(link => {
    link.clickHistory.forEach(click => {
      if (click.timestamp > weekAgo) {
        currentWeekClicks++;
      } else if (click.timestamp > twoWeeksAgo) {
        previousWeekClicks++;
      }
    });
  });

  const growth = previousWeekClicks > 0
    ? ((currentWeekClicks - previousWeekClicks) / previousWeekClicks) * 100
    : (currentWeekClicks > 0 ? 100 : 0);

  // Calculate Overall Health Score (0-100)
  // Weighted: 40% Activity (Engagement), 30% Growth (capped at 100), 30% Volume (normalized)
  const volumeScore = Math.min(100, (totalClicks / 100) * 100); // Target: 100 clicks/month
  const growthScore = Math.min(100, Math.max(0, growth + 100)); // Normalize growth (-100% to +100% -> 0-200, cap at 100?) -> actually let's just use raw growth capped
  // Better Growth Score: 0% growth = 50 score. 100% growth = 100 score. -50% growth = 25 score.
  const normalizedGrowthScore = Math.min(100, Math.max(0, 50 + growth / 2));

  const healthScore = Math.round(
    (engagement * 0.4) +
    (normalizedGrowthScore * 0.3) +
    (volumeScore * 0.3)
  );

  return [
    { metric: 'Avg Clicks', value: parseFloat(avgClicks.toFixed(1)) },
    { metric: 'Engagement', value: Math.round(engagement) }, // % of active links
    { metric: 'Reach', value: reach }, // Raw count of unique visitors
    { metric: 'Retention', value: Math.round(retention) },
    { metric: 'Growth', value: Math.round(growth) },
    { metric: 'Score', value: healthScore } // Add Score to the array
  ];
}

// Get top performing links by click count
export function getTopPerformingLinks(links: LinkData[], limit: number = 4): LinkData[] {
  return [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}
