import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import {
  StorageAdapter,
  QueryOptions,
  ClickEventInput,
  AggregatedClickData,
  ExportData,
} from './types';
import { LinkData, ClickEvent, Product, Tag, Folder, Domain, BioProfile, Team, TeamMember, TeamInvite, ApiKey, UserProfile, GalleryItem, NewsletterSubscriber, AppRecommendation } from '../../types';
import { parseUserAgent } from '../userAgentParser';
import { getGeolocation } from '../geolocationService';
import { v4 as uuidv4 } from 'uuid';
import { monetizeUrl } from '../../utils/affiliateUtils';

const STORAGE_KEYS = {
  LINKS: 'linkly_links',
  CLICKS: 'linkly_clicks',
  BIO_PROFILES: 'linkly_bio_profiles',
  PRODUCTS: 'linkly_products',
  DOMAINS: 'linkly_domains',
  TAGS: 'linkly_tags',
  FOLDERS: 'linkly_folders',
};

/**
 * Database row types for Supabase tables
 */
interface LinkRow {
  id: string;
  original_url: string;
  short_code: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  created_at: string;
  clicks: number;
  last_clicked_at: string | null;
  smart_redirects: { ios?: string; android?: string; desktop?: string } | null;
  geo_redirects?: Record<string, string>;
  start_date?: number | null;
  expiration_date?: number | null;
  max_clicks: number | null;
  password_hash: string | null;
  qr_code_data: string | null;
  ai_analysis: Record<string, unknown> | null;
  user_id: string | null;
  folder_id: string | null;
  is_guest?: boolean;
  claim_token?: string | null;
  expires_at?: string | null;
  ab_test_config: {
    enabled: boolean;
    variants: {
      id: string;
      url: string;
      weight: number;
    }[];
  } | null;
}

interface ClickEventRow {
  id: string;
  link_id: string;
  timestamp: string;
  referrer: string;
  device: string;
  os: string;
  browser?: string;
  country: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  timezone?: string;
  browser_version?: string;
  os_version?: string;
  screen_width?: number;
  screen_height?: number;
  language?: string;
  visitor_id?: string;
  raw_user_agent: string | null;
  ip_hash: string | null;
  // Marketing analytics
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  trigger_source?: string;
  destination_url?: string;
  device_model?: string; // New field
}

interface ProductRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  link_id: string;
  short_code: string | null;
  original_url: string | null;
  category: string | null;
  slug: string | null;
  created_at: string;
}

interface GalleryItemRow {
  id: string;
  user_id: string;
  url: string;
  caption: string | null;
  exif_data: Record<string, any> | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
}

interface NewsletterSubscriberRow {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}


interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

interface FolderRow {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

interface TeamRow {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
}

interface TeamMemberRow {
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamInviteRow {
  id: string;
  team_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
  created_by: string;
}

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// Helper to convert DB rows to app typese
/**
 * Convert a database row to LinkData object
 */
function rowToLinkData(row: LinkRow, clickHistory: ClickEvent[] = []): LinkData {
  return {
    id: row.id,
    originalUrl: row.original_url,
    shortCode: row.short_code,
    title: row.title,
    description: row.description ?? undefined,
    tags: row.tags || [],
    category: (row.category as LinkData['category']) ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    clicks: row.clicks,
    lastClickedAt: row.last_clicked_at ? new Date(row.last_clicked_at).getTime() : undefined,
    clickHistory,
    smartRedirects: row.smart_redirects as LinkData['smartRedirects'] ?? undefined,
    geoRedirects: row.geo_redirects ?? undefined,
    startDate: row.start_date ?? null,
    expirationDate: row.expiration_date ?? null,
    maxClicks: row.max_clicks,
    password: row.password_hash,
    qrCodeData: row.qr_code_data ?? undefined,
    aiAnalysis: row.ai_analysis as LinkData['aiAnalysis'] ?? undefined,
    folderId: row.folder_id ?? undefined,
    abTestConfig: row.ab_test_config as LinkData['abTestConfig'] ?? undefined,
  };
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
  };
}

function rowToFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/**
 * Convert LinkData to database row format
 */
function linkDataToRow(link: Omit<LinkData, 'id'> & { id?: string }, userId?: string | null): Partial<LinkRow> {
  return {
    id: link.id,
    original_url: link.originalUrl,
    short_code: link.shortCode,
    title: link.title,
    description: link.description ?? null,
    tags: link.tags,
    category: link.category ?? null,
    created_at: new Date(link.createdAt).toISOString(),
    clicks: link.clicks,
    last_clicked_at: link.lastClickedAt !== undefined ? new Date(link.lastClickedAt).toISOString() : null,
    smart_redirects: link.smartRedirects ?? null,
    geo_redirects: link.geoRedirects ?? null,
    start_date: link.startDate ?? null,
    expiration_date: link.expirationDate ?? null,
    max_clicks: link.maxClicks ?? null,
    password_hash: link.password ?? null,
    qr_code_data: link.qrCodeData ?? null,
    ai_analysis: link.aiAnalysis ?? null,
    user_id: userId ?? null,
    folder_id: link.folderId ?? null,
    ab_test_config: link.abTestConfig ?? null,
  };
}

/**
 * Convert a click event database row to ClickEvent object
 */
function rowToClickEvent(row: ClickEventRow): ClickEvent {
  return {
    timestamp: new Date(row.timestamp).getTime(),
    referrer: row.referrer,
    device: row.device as ClickEvent['device'],
    os: row.os as ClickEvent['os'],
    country: row.country,
    // Enhanced analytics fields
    countryCode: row.country_code,
    region: row.region,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    isp: row.isp,
    timezone: row.timezone,
    // Marketing analytics
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_term: row.utm_term,
    utm_content: row.utm_content,
    trigger_source: row.trigger_source,
    // Advanced Analytics
    browserVersion: row.browser_version,
    osVersion: row.os_version,
    screenWidth: row.screen_width,
    screenHeight: row.screen_height,
    language: row.language,
    visitorId: row.visitor_id,
    browser: row.browser,
    fingerprint: undefined,
    destinationUrl: row.destination_url,
    deviceModel: row.device_model,
  };
}


/**
 * Bio Profile Row
 */
interface BioProfileRow {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  links: string[]; // JSONB array stored as string[]
  views: number;
  created_at: string;
  updated_at: string;
  custom_theme?: any;
}

function rowToBioProfile(row: BioProfileRow): BioProfile {
  return {
    id: row.id,
    userId: row.user_id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    theme: row.theme as BioProfile['theme'],
    links: row.links || [],
    views: row.views,
    customTheme: row.custom_theme,
  };
}

function bioProfileToRow(profile: Partial<BioProfile>, userId?: string): Partial<BioProfileRow> {
  const row: Partial<BioProfileRow> = {};
  if (profile.handle) row.handle = profile.handle;
  if (profile.displayName) row.display_name = profile.displayName;
  if (profile.bio) row.bio = profile.bio;
  if (profile.avatarUrl) row.avatar_url = profile.avatarUrl;
  if (profile.theme) row.theme = profile.theme;
  if (profile.links) row.links = profile.links;
  if (profile.views !== undefined) row.views = profile.views;
  if (profile.customTheme) row.custom_theme = profile.customTheme;
  if (userId) row.user_id = userId;
  return row;
}

function rowToUserProfile(row: any): UserProfile {
  // ... (existing code)
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    website: row.website,
    updatedAt: row.updated_at,
    settingsNotifications: row.settings_notifications || {
      email: true,
      milestones: true,
      reports: true,
      security: true
    },
    flipkartAffiliateId: row.flipkart_affiliate_id,
    amazonAssociateTag: row.amazon_associate_tag,
    storefrontTheme: row.storefront_theme,
    storeName: row.store_name,
    storeLogoUrl: row.store_logo_url,
    storeBannerUrl: row.store_banner_url,
    upiId: row.upi_id,
    onboardingCompleted: row.onboarding_completed,
    onboardingStep: row.onboarding_step,
    onboardingSkipped: row.onboarding_skipped,
    onboardingStartedAt: row.onboarding_started_at,
    role: row.role,
  };
}

function userProfileToRow(profile: Partial<UserProfile>): any {
  // ... (existing code)
  const row: any = {};
  if (profile.username !== undefined) row.username = profile.username;
  if (profile.fullName !== undefined) row.full_name = profile.fullName;
  if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
  if (profile.website !== undefined) row.website = profile.website;
  if (profile.settingsNotifications !== undefined) row.settings_notifications = profile.settingsNotifications;
  if (profile.flipkartAffiliateId !== undefined) row.flipkart_affiliate_id = profile.flipkartAffiliateId;
  if (profile.amazonAssociateTag !== undefined) row.amazon_associate_tag = profile.amazonAssociateTag;
  if (profile.storefrontTheme !== undefined) row.storefront_theme = profile.storefrontTheme;
  if (profile.storeName !== undefined) row.store_name = profile.storeName;
  if (profile.storeLogoUrl !== undefined) row.store_logo_url = profile.storeLogoUrl;
  if (profile.storeBannerUrl !== undefined) row.store_banner_url = profile.storeBannerUrl;
  if (profile.upiId !== undefined) row.upi_id = profile.upiId;
  if (profile.onboardingCompleted !== undefined) row.onboarding_completed = profile.onboardingCompleted;
  if (profile.onboardingStep !== undefined) row.onboarding_step = profile.onboardingStep;
  if (profile.onboardingSkipped !== undefined) row.onboarding_skipped = profile.onboardingSkipped;
  if (profile.onboardingStartedAt !== undefined) row.onboarding_started_at = profile.onboardingStartedAt;
  if (profile.role !== undefined) row.role = profile.role;
  return row;
}



/**
 * Supabase implementation of the StorageAdapter interface
 */
export class SupabaseAdapter implements StorageAdapter {
  private static instance: SupabaseAdapter;

  /**
   * Generate a random short code for links
   * Uses base62 encoding (alphanumeric) for URL-safe codes
   */
  private generateShortCode(length: number = 6): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Get products for a user
   */


  /**
   * Get all links from the database
   */
  async getLinks(): Promise<LinkData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Get the current user's ID from the auth session
    const { data: { session } } = await supabase!.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.warn('[SupabaseAdapter] No authenticated user found for getLinks');
      return [];
    }

    const { data: linkRows, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch links: ${error.message}`);
    }

    if (!linkRows || linkRows.length === 0) {
      return [];
    }

    // Fetch all click events for all links in a single query (N+1 optimization)
    // Use range(0, 9999) to override Supabase's default 1000 row limit
    const linkIds = linkRows.map((row: LinkRow) => row.id);
    const { data: allClickEvents, error: clickError } = await supabase!
      .from(TABLES.CLICK_EVENTS)
      .select('*')
      .in('link_id', linkIds)
      .order('timestamp', { ascending: false })
      .range(0, 9999); // Fetch up to 10,000 rows

    if (clickError) {
      console.warn(`Failed to fetch click events: ${clickError.message}`);
    }

    // Group click events by link_id
    const clickEventsByLinkId: Record<string, ClickEvent[]> = {};
    (allClickEvents || []).forEach((row: ClickEventRow) => {
      if (!clickEventsByLinkId[row.link_id]) {
        clickEventsByLinkId[row.link_id] = [];
      }
      clickEventsByLinkId[row.link_id].push(rowToClickEvent(row));
    });

    // Map links with their click history
    const links = linkRows.map((row: LinkRow) => {
      const clickHistory = clickEventsByLinkId[row.id] || [];
      return rowToLinkData(row, clickHistory);
    });

    return links;
  }

  /**
   * Get public links by IDs (for Bio Pages)
   */
  async getPublicLinks(ids: string[]): Promise<LinkData[]> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.LINKS);
      const links: LinkData[] = stored ? JSON.parse(stored) : [];
      return links.filter(l => ids.includes(l.id));
    }

    if (ids.length === 0) return [];

    const { data: linkRows, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to fetch public links: ${error.message}`);
    }

    // For public view, we don't need click history
    return (linkRows || []).map((row: LinkRow) => rowToLinkData(row, []));
  }

  /**
   * Get a single link by ID
   */
  async getLink(id: string): Promise<LinkData | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch link: ${error.message}`);
    }

    const clickHistory = await this.getClickEvents(id);
    return rowToLinkData(row as LinkRow, clickHistory);
  }

  /**
   * Get a link by its short code
   */
  async getLinkByCode(shortCode: string): Promise<LinkData | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch link by code: ${error.message}`);
    }

    const clickHistory = await this.getClickEvents(row.id);
    return rowToLinkData(row as LinkRow, clickHistory);
  }


  /**
   * Create a new link
   * Automatically sets user_id from the current auth session
   * Requirements: 5.1
   */
  async createLink(link: Omit<LinkData, 'id'>): Promise<LinkData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Get the current user's ID from the auth session
    const { data: { session } } = await supabase!.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Apply monetization if user has configured it
    let finalUrl = link.originalUrl;
    if (userId && session?.user?.user_metadata) {
      const { flipkart_affiliate_id, amazon_associate_tag } = session.user.user_metadata;
      finalUrl = monetizeUrl(finalUrl, {
        flipkartAffiliateId: flipkart_affiliate_id,
        amazonAssociateTag: amazon_associate_tag,
      });
    }

    const id = uuidv4();
    const rowData = linkDataToRow({ ...link, id, originalUrl: finalUrl }, userId);

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .insert(rowData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create link: ${error.message}`);
    }

    const newLink = rowToLinkData(row as LinkRow, link.clickHistory || []);

    // Sync to Edge Cache (Fire and forget)
    if (newLink.shortCode && newLink.originalUrl) {
      this.syncToEdge(newLink.shortCode, newLink.originalUrl, newLink.id, {
        password: !!newLink.password,
        expiration: newLink.expirationDate,
        start: newLink.startDate
      }).catch(err => {
        console.warn('[SupabaseAdapter] Failed to sync to edge:', err);
      });
    }

    return newLink;
  }

  /**
   * Update an existing link
   */
  async updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Convert updates to row format, excluding id and clickHistory
    const { id: _id, clickHistory: _clickHistory, ...updateFields } = updates;
    const rowUpdates: Partial<LinkRow> = {};

    if (updateFields.originalUrl !== undefined) rowUpdates.original_url = updateFields.originalUrl;
    if (updateFields.shortCode !== undefined) rowUpdates.short_code = updateFields.shortCode;
    if (updateFields.title !== undefined) rowUpdates.title = updateFields.title;
    if (updateFields.description !== undefined) rowUpdates.description = updateFields.description ?? null;
    if (updateFields.tags !== undefined) rowUpdates.tags = updateFields.tags;
    if (updateFields.category !== undefined) rowUpdates.category = updateFields.category ?? null;
    if (updateFields.clicks !== undefined) rowUpdates.clicks = updateFields.clicks;
    if (updateFields.lastClickedAt !== undefined) {
      rowUpdates.last_clicked_at = updateFields.lastClickedAt
        ? new Date(updateFields.lastClickedAt).toISOString()
        : null;
    }
    if (updateFields.smartRedirects !== undefined) rowUpdates.smart_redirects = updateFields.smartRedirects ?? null;
    if (updateFields.geoRedirects !== undefined) rowUpdates.geo_redirects = updateFields.geoRedirects ?? null;
    if (updateFields.expirationDate !== undefined) {
      rowUpdates.expiration_date = updateFields.expirationDate ?? null;
    }
    if (updateFields.startDate !== undefined) {
      rowUpdates.start_date = updateFields.startDate ?? null;
    }
    rowUpdates.max_clicks = updateFields.maxClicks ?? null;
    if (updateFields.password !== undefined) rowUpdates.password_hash = updateFields.password ?? null;
    if (updateFields.qrCodeData !== undefined) rowUpdates.qr_code_data = updateFields.qrCodeData ?? null;
    if (updateFields.aiAnalysis !== undefined) rowUpdates.ai_analysis = updateFields.aiAnalysis ?? null;
    if (updateFields.folderId !== undefined) rowUpdates.folder_id = updateFields.folderId ?? null;
    if (updateFields.abTestConfig !== undefined) rowUpdates.ab_test_config = updateFields.abTestConfig ?? null;

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update link: ${error.message}`);
    }

    // Invalidate cache for this link
    try {
      const { invalidateLinkCache } = await import('../cacheService');
      if (row.short_code) {
        await invalidateLinkCache(row.short_code);
      }
    } catch (cacheError) {
      console.warn('Failed to invalidate cache:', cacheError);
    }

    const clickHistory = await this.getClickEvents(id);
    const updatedLink = rowToLinkData(row as LinkRow, clickHistory);

    // Sync to Edge Cache (Fire and forget)
    if (updatedLink.shortCode && updatedLink.originalUrl) {
      this.syncToEdge(updatedLink.shortCode, updatedLink.originalUrl, updatedLink.id, {
        password: !!updatedLink.password,
        expiration: updatedLink.expirationDate,
        start: updatedLink.startDate
      }).catch(err => {
        console.warn('[SupabaseAdapter] Failed to sync to edge:', err);
      });
    }

    return updatedLink;
  }

  /**
   * Sync link to Edge Cache (Redis)
   */
  private async syncToEdge(shortCode: string, originalUrl: string, id: string, options: { password?: boolean; expiration?: number | null; start?: number | null } = {}): Promise<void> {
    try {
      await fetch('/api/link/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shortCode,
          originalUrl,
          id,
          password: options.password,
          expiration: options.expiration,
          start: options.start
        }),
      });
    } catch (error) {
      console.error('[SupabaseAdapter] Sync error:', error);
      throw error;
    }
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Get short code before deleting (for cache invalidation)
    const { data: linkData } = await supabase!
      .from(TABLES.LINKS)
      .select('short_code')
      .eq('id', id)
      .single();

    const { error } = await supabase!
      .from(TABLES.LINKS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete link: ${error.message}`);
    }

    // Invalidate cache for this link
    if (linkData?.short_code) {
      try {
        const { invalidateLinkCache } = await import('../cacheService');
        await invalidateLinkCache(linkData.short_code);
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError);
      }
    }
  }

  /**
   * Create a guest link (no authentication required)
   * Links expire after 7 days to drive signup conversion
   */
  /**
   * Create a guest link (no authentication required)
   * Uses RPC for secure creation and rate limiting
   */
  async createGuestLink(url: string, sessionId: string): Promise<LinkData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Generate short code locally (or could be done in RPC)
    const shortCode = this.generateShortCode();

    const { data, error } = await supabase!.rpc('create_guest_link', {
      p_original_url: url,
      p_short_code: shortCode,
      p_guest_session_id: sessionId
    });

    if (error) {
      throw new Error(`Failed to create guest link: ${error.message}`);
    }

    // Construct LinkData from returned JSON
    // RPC returns: { id, short_code, claim_token, expires_at }
    return {
      id: data.id,
      originalUrl: url,
      shortCode: data.short_code,
      title: 'Guest Link',
      clicks: 0,
      createdAt: Date.now(),
      tags: [],
      clickHistory: [],
      isGuest: true,
      claimToken: data.claim_token,
      expiresAt: new Date(data.expires_at).getTime(),
    };
  }

  /**
   * Claim a guest link and transfer it to a user account
   */
  async claimGuestLink(claimToken: string, userId: string): Promise<LinkData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase!.rpc('claim_guest_link', {
      p_claim_token: claimToken,
      p_user_id: userId
    });

    if (error) {
      throw new Error(`Failed to claim link: ${error.message}`);
    }

    // Fetch the full link data after claiming
    return this.getLink(data.link_id) as Promise<LinkData>;
  }

  /**
   * Get guest links for a specific session
   */
  async getGuestLinks(sessionId: string): Promise<LinkData[]> {
    if (!isSupabaseConfigured()) return [];

    const { data: linkRows, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .eq('guest_session_id', sessionId)
      .eq('is_guest', true)
      .gt('expires_at', new Date().toISOString()) // Only show non-expired
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch guest links:', error);
      return [];
    }

    return (linkRows || []).map((row: LinkRow) => ({
      ...rowToLinkData(row, []),
      isGuest: true,
      claimToken: row.claim_token || undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined
    }));
  }

  /**
   * Get guest link by claim token
   */
  async getGuestLinkByToken(claimToken: string): Promise<LinkData | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .eq('claim_token', claimToken)
      .eq('is_guest', true)
      .single();

    if (error || !row) {
      return null;
    }

    const clickHistory = await this.getClickEvents(row.id);
    return {
      ...rowToLinkData(row as LinkRow, clickHistory),
      isGuest: true,
      claimToken: row.claim_token,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined
    };
  }

  /**
   * Cleanup expired guest links
   * Should be run daily via cron job
   */
  async cleanupExpiredGuestLinks(): Promise<number> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase!
      .from(TABLES.LINKS)
      .delete()
      .eq('is_guest', true)
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Failed to cleanup expired guest links:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Delete a tag
   */


  /**
   * Update a tag
   */
  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const rowUpdates: Partial<TagRow> = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.color !== undefined) rowUpdates.color = updates.color;

    const { data, error } = await supabase!
      .from(TABLES.TAGS)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tag: ${error.message}`);
    }

    return rowToTag(data as TagRow);
  }


  /**
   * Record a click event for a link
   */
  async recordClick(linkId: string, event: ClickEventInput): Promise<void> {
    console.log('[SupabaseAdapter] recordClick called for linkId:', linkId);

    if (!isSupabaseConfigured()) {
      console.error('[SupabaseAdapter] Supabase is not configured!');
      throw new Error('Supabase is not configured');
    }

    // Parse user agent for device, OS, and browser
    const { device, os, browser, browserVersion, osVersion } = parseUserAgent(event.userAgent);
    console.log('[SupabaseAdapter] Parsed UA:', { device, os, browser, browserVersion, osVersion });

    // Get geolocation data
    const geoData = await getGeolocation(event.ipAddress);
    console.log('[SupabaseAdapter] Geolocation:', geoData);

    // Create click event row
    const clickEventRow: ClickEventRow = {
      id: uuidv4(),
      link_id: linkId,
      timestamp: new Date().toISOString(),
      referrer: event.referrer,
      device,
      os,
      browser, // New field
      country: geoData.country || 'Unknown',
      country_code: geoData.countryCode,
      city: geoData.city,
      region: geoData.region,
      latitude: geoData.lat,
      longitude: geoData.lon,
      isp: geoData.isp,
      timezone: geoData.timezone || event.timezone,
      browser_version: browserVersion,
      os_version: osVersion,
      screen_width: event.screenWidth,
      screen_height: event.screenHeight,
      language: event.language,
      visitor_id: event.visitorId,
      raw_user_agent: event.userAgent,
      ip_hash: hashIP(event.ipAddress),
      // Marketing analytics
      utm_source: event.utm_source,
      utm_medium: event.utm_medium,
      utm_campaign: event.utm_campaign,
      utm_term: event.utm_term,
      utm_content: event.utm_content,
      trigger_source: event.trigger_source,
      destination_url: event.destinationUrl,
      device_model: event.deviceModel,
    };
    console.log('[SupabaseAdapter] Click event row:', clickEventRow);

    const { error: clickError } = await supabase!
      .from(TABLES.CLICK_EVENTS)
      .insert(clickEventRow);

    if (clickError) {
      console.error('[SupabaseAdapter] Failed to insert click event:', clickError);
      throw new Error(`Failed to record click: ${clickError.message}`);
    }
    console.log('[SupabaseAdapter] Click event inserted successfully');

    // Update link click count and last clicked timestamp
    console.log('[SupabaseAdapter] Calling increment_link_clicks RPC...');
    const { error: updateError } = await supabase!.rpc('increment_link_clicks', {
      link_id: linkId,
      clicked_at: clickEventRow.timestamp,
    });

    // If RPC doesn't exist, fall back to manual update
    if (updateError) {
      console.warn('[SupabaseAdapter] RPC failed, falling back to manual update:', updateError);
      const { data: link } = await supabase!
        .from(TABLES.LINKS)
        .select('clicks')
        .eq('id', linkId)
        .single();

      if (link) {
        const { error: manualUpdateError } = await supabase!
          .from(TABLES.LINKS)
          .update({
            clicks: (link.clicks || 0) + 1,
            last_clicked_at: clickEventRow.timestamp,
          })
          .eq('id', linkId);

        if (manualUpdateError) {
          console.error('[SupabaseAdapter] Manual update failed:', manualUpdateError);
        } else {
          console.log('[SupabaseAdapter] Manual update successful');
        }
      }
    } else {
      console.log('[SupabaseAdapter] RPC increment successful');
    }
  }

  /**
   * Get click events for a link with optional filtering and pagination
   */
  async getClickEvents(linkId: string, options?: QueryOptions): Promise<ClickEvent[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    let query = supabase!
      .from(TABLES.CLICK_EVENTS)
      .select('*')
      .eq('link_id', linkId)
      .order('timestamp', { ascending: false });

    if (options?.startDate) {
      query = query.gte('timestamp', new Date(options.startDate).toISOString());
    }
    if (options?.endDate) {
      query = query.lte('timestamp', new Date(options.endDate).toISOString());
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    // Override Supabase's default 1000 row limit when no explicit limit is set
    if (!options?.limit && !options?.offset) {
      query = query.range(0, 9999); // Fetch up to 10,000 rows
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch click events: ${error.message}`);
    }

    return (rows || []).map((row: ClickEventRow) => rowToClickEvent(row));
  }


  /**
   * Get aggregated click data for a link
   */
  async getAggregatedClicks(
    linkId: string,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<AggregatedClickData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Fetch all click events for the link
    const events = await this.getClickEvents(linkId);

    // Group events by period
    const groupedData = new Map<string, ClickEventRow[]>();

    events.forEach((event) => {
      const date = new Date(event.timestamp);
      let periodKey: string;

      switch (groupBy) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData.has(periodKey)) {
        groupedData.set(periodKey, []);
      }
      groupedData.get(periodKey)!.push(event as unknown as ClickEventRow);
    });

    // Convert to aggregated data
    const result: AggregatedClickData[] = [];

    groupedData.forEach((periodEvents, period) => {
      const referrerCounts = new Map<string, number>();
      const deviceCounts = new Map<string, number>();
      const countryCounts = new Map<string, number>();
      const uniqueIPs = new Set<string>();

      periodEvents.forEach((event) => {
        // Count referrers
        const referrer = (event as unknown as ClickEvent).referrer || 'direct';
        referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);

        // Count devices
        const device = (event as unknown as ClickEvent).device;
        deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);

        // Count countries
        const country = (event as unknown as ClickEvent).country || 'Unknown';
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);

        // Track unique visitors (using ip_hash if available)
        if (event.ip_hash) {
          uniqueIPs.add(event.ip_hash);
        }
      });

      result.push({
        period,
        clicks: periodEvents.length,
        uniqueVisitors: uniqueIPs.size || periodEvents.length,
        topReferrers: Array.from(referrerCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        deviceBreakdown: Array.from(deviceCounts.entries())
          .map(([device, count]) => ({ device, count })),
        countryBreakdown: Array.from(countryCounts.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      });
    });

    return result.sort((a, b) => a.period.localeCompare(b.period));
  }

  async getDomains(userId: string): Promise<Domain[]> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.DOMAINS);
      const domains: Domain[] = stored ? JSON.parse(stored) : [];
      return domains.filter(d => d.userId === userId);
    }

    const { data, error } = await supabase!
      .from(TABLES.DOMAINS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      return [];
    }

    return (data || []).map((row: DomainRow) => rowToDomain(row));
  }

  async addDomain(userId: string, domainName: string, targetType: 'bio' | 'store' = 'bio'): Promise<Domain> {
    if (!isSupabaseConfigured()) {
      const newDomain: Domain = {
        id: uuidv4(),
        userId,
        domain: domainName,
        status: 'pending',
        verificationToken: `verify_${uuidv4().substring(0, 8)}`,
        targetType,
        createdAt: Date.now(),
      };
      const stored = localStorage.getItem(STORAGE_KEYS.DOMAINS);
      const domains: Domain[] = stored ? JSON.parse(stored) : [];
      domains.push(newDomain);
      localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(domains));
      return newDomain;
    }

    const { data, error } = await supabase!
      .from(TABLES.DOMAINS)
      .insert({
        user_id: userId,
        domain: domainName,
        status: 'pending',
        verification_token: `verify_${uuidv4().substring(0, 8)}`,
        target_type: targetType,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add domain: ${error.message}`);
    }

    return rowToDomain(data as DomainRow);
  }

  async removeDomain(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.DOMAINS);
      if (stored) {
        const domains: Domain[] = JSON.parse(stored);
        const filtered = domains.filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(filtered));
      }
      return;
    }

    const { error } = await supabase!
      .from(TABLES.DOMAINS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to remove domain: ${error.message}`);
    }
  }

  async verifyDomain(id: string): Promise<Domain | null> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.DOMAINS);
      if (stored) {
        const domains: Domain[] = JSON.parse(stored);
        const index = domains.findIndex(d => d.id === id);
        if (index !== -1) {
          domains[index].status = 'active';
          domains[index].verifiedAt = Date.now();
          localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(domains));
          return domains[index];
        }
      }
      return null;
    }

    // In a real scenario, we would check DNS records here.
    // For now, we'll assume it's valid and update the DB.

    const { data, error } = await supabase!
      .from(TABLES.DOMAINS)
      .update({
        status: 'active',
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error verifying domain:', error);
      return null;
    }

    return rowToDomain(data as DomainRow);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<any>): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase!
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Get all bio profiles for the current user
   */
  async getBioProfiles(userId: string): Promise<BioProfile[]> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.BIO_PROFILES);
      const profiles: BioProfile[] = stored ? JSON.parse(stored) : [];
      return profiles;
    }

    const { data, error } = await supabase!
      .from(TABLES.BIO_PROFILES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bio profiles: ${error.message}`);
    }

    return (data || []).map((row: BioProfileRow) => rowToBioProfile(row));
  }

  /**
   * Get a bio profile by handle (public access)
   */
  /**
   * Get user profile by ID (public info)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return rowToUserProfile(data);
  }

  /**
   * Get bio profile by handle
   */
  async getBioProfileByHandle(handle: string): Promise<BioProfile | null> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.BIO_PROFILES);
      const profiles: BioProfile[] = stored ? JSON.parse(stored) : [];
      return profiles.find(p => p.handle === handle) || null;
    }

    const { data, error } = await supabase!
      .from(TABLES.BIO_PROFILES)
      .select('*')
      .eq('handle', handle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch bio profile: ${error.message}`);
    }

    // Increment views (fire and forget)
    supabase!.rpc('increment_bio_views', { profile_id: data.id }).then(({ error }) => {
      if (error) console.error('Failed to increment views:', error);
    });

    return rowToBioProfile(data as BioProfileRow);
  }

  /**
   * Create a new bio profile
   */
  async createBioProfile(profile: Omit<BioProfile, 'id' | 'views'>): Promise<BioProfile> {
    if (!isSupabaseConfigured()) {
      const newProfile: BioProfile = {
        ...profile,
        id: uuidv4(),
        views: 0,
      };
      const stored = localStorage.getItem(STORAGE_KEYS.BIO_PROFILES);
      const profiles: BioProfile[] = stored ? JSON.parse(stored) : [];
      profiles.push(newProfile);
      localStorage.setItem(STORAGE_KEYS.BIO_PROFILES, JSON.stringify(profiles));
      return newProfile;
    }

    let userId = profile.userId;

    if (!userId) {
      const { data: { session } } = await supabase!.auth.getSession();
      userId = session?.user?.id;
    }

    if (!userId) throw new Error('User not authenticated');

    const rowData = bioProfileToRow(profile, userId);

    const { data, error } = await supabase!
      .from(TABLES.BIO_PROFILES)
      .insert(rowData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bio profile: ${error.message}`);
    }

    return rowToBioProfile(data as BioProfileRow);
  }

  /**
   * Update a bio profile
   */
  async updateBioProfile(id: string, updates: Partial<BioProfile>): Promise<BioProfile> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.BIO_PROFILES);
      if (stored) {
        const profiles: BioProfile[] = JSON.parse(stored);
        const index = profiles.findIndex(p => p.id === id);
        if (index !== -1) {
          profiles[index] = { ...profiles[index], ...updates };
          localStorage.setItem(STORAGE_KEYS.BIO_PROFILES, JSON.stringify(profiles));
          return profiles[index];
        }
      }
      throw new Error('Profile not found');
    }

    const rowUpdates = bioProfileToRow(updates);

    const { data, error } = await supabase!
      .from(TABLES.BIO_PROFILES)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update bio profile: ${error.message}`);
    }

    return rowToBioProfile(data as BioProfileRow);
  }

  /**
   * Delete a bio profile
   */
  async deleteBioProfile(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.BIO_PROFILES);
      if (stored) {
        const profiles: BioProfile[] = JSON.parse(stored);
        const filtered = profiles.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.BIO_PROFILES, JSON.stringify(filtered));
      }
      return;
    }

    const { error } = await supabase!
      .from(TABLES.BIO_PROFILES)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete bio profile: ${error.message}`);
    }
  }

  /**
   * Update the order of links
   */
  async updateLinkOrder(linkIds: string[]): Promise<void> {
    if (!isSupabaseConfigured()) return;

    // We'll update each link's order_index
    const updates = linkIds.map((id, index) =>
      supabase!
        .from(TABLES.LINKS)
        .update({ order_index: index })
        .eq('id', id)
    );

    await Promise.all(updates);
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(settings: any): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { data: { session } } = await supabase!.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase!
      .from('profiles')
      .update({ settings_notifications: settings })
      .eq('id', session.user.id);

    if (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Export all data (links and click events)
   */
  async exportAllData(): Promise<ExportData> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const links = await this.getLinks();

    // Collect all click events
    const allClickEvents: ClickEvent[] = [];
    for (const link of links) {
      allClickEvents.push(...link.clickHistory);
    }

    return {
      links,
      clickEvents: allClickEvents,
      exportedAt: Date.now(),
    };
  }

  /**
   * Product Storefront Methods
   */

  /**
   * Create a new product
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const row: ProductRow = {
      id,
      user_id: product.userId,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      image_url: product.imageUrl ?? null,
      link_id: product.linkId,
      short_code: null,
      original_url: null,
      category: null,
      created_at: now,
      slug: product.slug ?? null,
    };

    const { data, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return rowToProduct(data as ProductRow);
  }

  /**
   * Get all products for a user
   */
  async getProducts(userId: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        link:links (
          short_code,
          original_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...rowToProduct(row),
      shortCode: row.link?.short_code,
      originalUrl: row.link?.original_url
    }));
  }

  /**
   * Fetches aggregated analytics from the summary table
   */
  async getAnalyticsSummary(linkId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase!
      .from('analytics_daily_summary')
      .select('*')
      .eq('link_id', linkId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return rowToProduct(data as ProductRow);
  }

  /**
   * Get a single product by Slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return rowToProduct(data as ProductRow);
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const rowUpdates: Partial<ProductRow> = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.description !== undefined) rowUpdates.description = updates.description;
    if (updates.price !== undefined) rowUpdates.price = updates.price;
    if (updates.currency !== undefined) rowUpdates.currency = updates.currency;
    if (updates.currency !== undefined) rowUpdates.currency = updates.currency;
    if (updates.imageUrl !== undefined) rowUpdates.image_url = updates.imageUrl;
    if (updates.slug !== undefined) rowUpdates.slug = updates.slug;

    const { data, error } = await supabase!
      .from(TABLES.PRODUCTS)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return rowToProduct(data as ProductRow);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase!
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }


  /**
   * Tag Methods
   */

  async getTags(userId: string): Promise<Tag[]> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { data, error } = await supabase!
      .from(TABLES.TAGS)
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
    return (data || []).map((row: any) => rowToTag(row));
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { data, error } = await supabase!
      .from(TABLES.TAGS)
      .insert({
        user_id: tag.userId,
        name: tag.name,
        color: tag.color,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tag: ${error.message}`);
    return rowToTag(data as TagRow);
  }

  async deleteTag(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { error } = await supabase!
      .from(TABLES.TAGS)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete tag: ${error.message}`);
  }

  /**
   * Folder Methods
   */

  async getFolders(userId: string): Promise<Folder[]> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { data, error } = await supabase!
      .from(TABLES.FOLDERS)
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw new Error(`Failed to fetch folders: ${error.message}`);
    return (data || []).map((row: any) => rowToFolder(row));
  }

  async createFolder(folder: Omit<Folder, 'id' | 'createdAt'>): Promise<Folder> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { data, error } = await supabase!
      .from(TABLES.FOLDERS)
      .insert({
        user_id: folder.userId,
        name: folder.name,
        parent_id: folder.parentId ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create folder: ${error.message}`);
    return rowToFolder(data as FolderRow);
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const rowUpdates: any = {};
    if (updates.name !== undefined) rowUpdates.name = updates.name;
    if (updates.parentId !== undefined) rowUpdates.parent_id = updates.parentId;

    const { data, error } = await supabase!
      .from(TABLES.FOLDERS)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update folder: ${error.message}`);
    return rowToFolder(data as FolderRow);
  }

  async moveFolder(folderId: string, newParentId: string | null): Promise<void> {
    if (!isSupabaseConfigured()) {
      const stored = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (stored) {
        const folders: Folder[] = JSON.parse(stored);
        const index = folders.findIndex(f => f.id === folderId);
        if (index !== -1) {
          folders[index].parentId = newParentId;
          localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
        }
      }
      return;
    }

    const { error } = await supabase!
      .from(TABLES.FOLDERS)
      .update({ parent_id: newParentId })
      .eq('id', folderId);

    if (error) {
      throw new Error(`Failed to move folder: ${error.message}`);
    }
  }

  async deleteFolder(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const { error } = await supabase!
      .from(TABLES.FOLDERS)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete folder: ${error.message}`);
  }
  // Team Management
  async createTeam(name: string, slug: string, ownerId: string): Promise<Team> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    // Use RPC for atomic creation to avoid RLS issues
    const { data, error } = await supabase!.rpc('create_team_with_owner', {
      p_name: name,
      p_slug: slug,
      p_owner_id: ownerId
    });

    if (error) {
      console.error('RPC create_team_with_owner failed:', error);
      // Fallback to manual insertion if RPC doesn't exist (for backward compatibility or if migration wasn't run)
      // Note: This fallback might fail if RLS policies aren't fixed, but it's better than nothing.
      return this.createTeamFallback(name, slug, ownerId);
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      avatarUrl: null, // RPC doesn't return avatar currently
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  // Fallback implementation (original logic)
  private async createTeamFallback(name: string, slug: string, ownerId: string): Promise<Team> {
    const { data, error } = await supabase!
      .from('teams')
      .insert({
        name,
        slug,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as a member automatically
    await supabase!.from('team_members').insert({
      team_id: data.id,
      user_id: ownerId,
      role: 'owner',
    });

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      avatarUrl: data.avatar_url,
      ownerId: data.owner_id,
      createdAt: new Date(data.created_at).getTime(),
    };
  }

  async getTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase!
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return data.map((row: TeamRow) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      avatarUrl: row.avatar_url || undefined,
      ownerId: row.owner_id,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async getTeamInvites(teamId: string): Promise<TeamInvite[]> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { data, error } = await supabase!
      .from('team_invites')
      .select('*')
      .eq('team_id', teamId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return data.map(invite => ({
      id: invite.id,
      teamId: invite.team_id,
      email: invite.email,
      role: invite.role as any,
      token: invite.token,
      expiresAt: new Date(invite.expires_at).getTime(),
      createdAt: new Date(invite.created_at).getTime(),
      createdBy: invite.created_by
    }));
  }

  // Profile Management
  async uploadAvatar(userId: string, file: File): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase!.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: publicUrl });

    // Also update Supabase Auth metadata so it reflects in the UI immediately
    await supabase!.auth.updateUser({
      data: { avatar_url: publicUrl }
    });

    return publicUrl;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase!
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return data.map((row: TeamMemberRow) => ({
      teamId: row.team_id,
      userId: row.user_id,
      role: row.role as any,
      joinedAt: new Date(row.joined_at).getTime(),
    }));
  }

  async createInvite(teamId: string, email: string, role: string): Promise<TeamInvite> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Use RPC to bypass RLS issues
    const { data, error } = await supabase!.rpc('create_team_invite', {
      p_team_id: teamId,
      p_email: email,
      p_role: role,
      p_token: token
    });

    if (error) throw error;

    // Return constructed object since RPC only returns ID
    return {
      id: (data as any).id,
      teamId,
      email,
      role: role as any,
      token,
      expiresAt: new Date(expiresAt).getTime(),
      createdAt: Date.now(),
      createdBy: (await supabase!.auth.getUser()).data.user?.id || '',
    };
  }

  async acceptInvite(token: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    // 1. Get invite
    const { data: invite, error: inviteError } = await supabase!
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) throw new Error('Invalid invite');

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Invite expired');
    }

    // 2. Add member
    const { error: memberError } = await supabase!
      .from('team_members')
      .insert({
        team_id: invite.team_id,
        user_id: userId,
        role: invite.role,
      });

    if (memberError) throw memberError;

    // 3. Delete invite
    await supabase!.from('team_invites').delete().eq('id', invite.id);
  }

  // API Access
  async createApiKey(name: string, scopes: string[] = ['links:read']): Promise<{ apiKey: ApiKey; secretKey: string }> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate key
    const prefix = 'pk_live_';
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const secretPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const secretKey = `${prefix}${secretPart}`;

    // Hash key for storage (simple sha256 for demo, ideally use bcrypt/argon2 on server)
    // Note: In a real app, hashing should happen on the server/edge function to keep the secret secret.
    // Since we are client-side only for now, we'll simulate this flow.
    // Ideally, we'd call an Edge Function: supabase.functions.invoke('create-api-key')

    // For this demo, we'll store the hash.
    const encoder = new TextEncoder();
    const data = encoder.encode(secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: row, error } = await supabase!
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        prefix: secretKey.substring(0, 12) + '...', // Store prefix for display
        scopes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      apiKey: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        prefix: row.prefix,
        scopes: row.scopes,
        lastUsedAt: row.last_used_at ? new Date(row.last_used_at).getTime() : undefined,
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
        createdAt: new Date(row.created_at).getTime(),
      },
      secretKey, // Return full key only once
    };
  }

  async getApiKeys(): Promise<ApiKey[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase!
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data.map((row: ApiKeyRow) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      prefix: row.prefix,
      scopes: row.scopes,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at).getTime() : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
      createdAt: new Date(row.created_at).getTime(),
    }));
  }

  async revokeApiKey(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

    const { error } = await supabase!
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
  /**
   * Get all user profiles (Admin only)
   */
  async getAllProfiles(limit: number = 50, offset: number = 0): Promise<UserProfile[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: rows, error } = await supabase!
      .from(TABLES.PROFILES)
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    return (rows || []).map(rowToUserProfile);
  }
  // ============================================
  // Gallery Methods
  // ============================================

  async getGalleryItems(userId: string): Promise<GalleryItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery items:', error);
      throw error;
    }

    return (data || []).map(rowToGalleryItem);
  }

  async addGalleryItem(
    userId: string,
    url: string,
    caption?: string,
    exifData?: any,
    width?: number,
    height?: number
  ): Promise<GalleryItem> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

    const newItem = {
      user_id: userId,
      url,
      caption,
      exif_data: exifData,
      width,
      height,
      sort_order: 0 // Default to top? Or bottom?
    };

    const { data, error } = await supabase
      .from('gallery_items')
      .insert(newItem)
      .select()
      .single();

    if (error) {
      console.error('Error adding gallery item:', error);
      throw error;
    }

    return rowToGalleryItem(data);
  }

  async deleteGalleryItem(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    // First get the item to find the file URL
    const { data: item } = await supabase
      .from('gallery_items')
      .select('url')
      .eq('id', id)
      .single();

    if (item?.url) {
      // Extract filename from URL
      // URL format: .../gallery-images/filename
      const parts = item.url.split('/');
      const filename = parts[parts.length - 1];

      // Delete from storage
      // Note: We need the full path including user_id folder if applicable
      // The upload function uses `${userId}/${uuidv4()}.${fileExt}`
      // So filename here might just be the uuid part if we split by /
      // Let's rely on the fact that we store the full public URL.
      // We need to parse the path relative to the bucket.
      // URL: https://.../storage/v1/object/public/gallery-images/USER_ID/FILENAME

      const urlObj = new URL(item.url);
      const pathParts = urlObj.pathname.split('/gallery-images/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1]; // USER_ID/FILENAME
        await supabase.storage
          .from('gallery-images')
          .remove([storagePath]);
      }
    }

    // Delete from DB
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  async uploadGalleryImage(file: File, userId: string): Promise<string> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading gallery image:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async updateGalleryOrder(items: GalleryItem[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;

    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index,
      user_id: item.userId, // Required for RLS usually, though update by ID works if policy allows
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('gallery_items')
      .upsert(updates);

    if (error) {
      console.error('Error updating gallery order:', error);
      throw error;
    }
  }
  // ============================================
  // Newsletter Methods
  // ============================================

  async addSubscriber(userId: string, email: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        user_id: userId,
        email: email
      });

    if (error) {
      // Ignore unique violation (already subscribed)
      if (error.code === '23505') return;
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }

  async getSubscribers(userId: string): Promise<NewsletterSubscriber[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }

    return (data || []).map(rowToNewsletterSubscriber);
  }

  async deleteSubscriber(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // App Stack (What's On My Phone)
  // ==========================================

  async getApps(userId: string): Promise<AppRecommendation[]> {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase
      .from('app_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(rowToAppRecommendation);
  }

  async addApp(userId: string, app: Omit<AppRecommendation, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<AppRecommendation> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');
    // Get max sort order
    const { data: maxOrderData } = await supabase
      .from('app_recommendations')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (maxOrderData?.[0]?.sort_order || 0) + 1;

    const { data, error } = await supabase
      .from('app_recommendations')
      .insert({
        user_id: userId,
        name: app.name,
        icon_url: app.iconUrl,
        developer: app.developer,
        category: app.category,
        description: app.description,
        link_url: app.linkUrl,
        is_paid: app.isPaid,
        sort_order: nextOrder
      })
      .select()
      .single();

    if (error) throw error;
    return rowToAppRecommendation(data);
  }

  async deleteApp(id: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;
    // Delete icon if exists
    const { data: app } = await supabase
      .from('app_recommendations')
      .select('icon_url')
      .eq('id', id)
      .single();

    if (app?.icon_url) {
      const path = app.icon_url.split('/').pop();
      if (path) {
        await supabase.storage.from('app-icons').remove([path]);
      }
    }

    const { error } = await supabase
      .from('app_recommendations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async uploadAppIcon(file: File, userId: string): Promise<string> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('app-icons')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('app-icons')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async updateAppOrder(items: AppRecommendation[]): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) return;
    const updates = items.map((item, index) => ({
      id: item.id,
      user_id: item.userId,
      sort_order: index,
      name: item.name, // Required for update
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('app_recommendations')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;
  }

  static getInstance(): SupabaseAdapter {
    if (!SupabaseAdapter.instance) {
      SupabaseAdapter.instance = new SupabaseAdapter();
    }
    return SupabaseAdapter.instance;
  }
}

function rowToAppRecommendation(row: any): AppRecommendation {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    iconUrl: row.icon_url,
    developer: row.developer,
    category: row.category,
    description: row.description,
    linkUrl: row.link_url,
    isPaid: row.is_paid,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).getTime()
  };
}

function rowToNewsletterSubscriber(row: NewsletterSubscriberRow): NewsletterSubscriber {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    createdAt: new Date(row.created_at).getTime()
  };
}

// Helper functions
function rowToGalleryItem(row: GalleryItemRow): GalleryItem {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    caption: row.caption || undefined,
    exifData: row.exif_data || undefined,
    width: row.width || undefined,
    height: row.height || undefined,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  };
}


/**
 * Convert a product database row to Product object
 */
function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency,
    imageUrl: row.image_url ?? undefined,
    linkId: row.link_id,
    slug: row.slug ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

interface DomainRow {
  id: string;
  user_id: string;
  domain: string;
  status: string;
  verification_token: string;
  target_type: string;
  created_at: string;
  verified_at: string | null;
}

function rowToDomain(row: DomainRow): Domain {
  return {
    id: row.id,
    userId: row.user_id,
    domain: row.domain,
    status: row.status as Domain['status'],
    verificationToken: row.verification_token,
    targetType: (row.target_type as Domain['targetType']) || 'bio',
    createdAt: new Date(row.created_at).getTime(),
    verifiedAt: row.verified_at ? new Date(row.verified_at).getTime() : undefined,
  };
}

/**
 * Simple hash function for IP addresses (for privacy)
 */
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Singleton instance of the Supabase adapter
 */
export const supabaseAdapter = new SupabaseAdapter();
