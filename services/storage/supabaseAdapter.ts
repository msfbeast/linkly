import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import {
  StorageAdapter,
  QueryOptions,
  ClickEventInput,
  AggregatedClickData,
  ExportData,
} from './types';
import { LinkData, ClickEvent } from '../../types';
import { parseUserAgent } from '../userAgentParser';
import { getCountryFromIP } from '../geolocationService';
import { v4 as uuidv4 } from 'uuid';

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
  geo_redirects: Record<string, string> | null;
  expiration_date: string | null;
  max_clicks: number | null;
  password_hash: string | null;
  qr_code_data: string | null;
  ai_analysis: Record<string, unknown> | null;
  user_id: string | null;
}

interface ClickEventRow {
  id: string;
  link_id: string;
  timestamp: string;
  referrer: string;
  device: string;
  os: string;
  country: string;
  raw_user_agent: string | null;
  ip_hash: string | null;
}


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
    expirationDate: row.expiration_date ? new Date(row.expiration_date).getTime() : null,
    maxClicks: row.max_clicks,
    password: row.password_hash,
    qrCodeData: row.qr_code_data ?? undefined,
    aiAnalysis: row.ai_analysis as LinkData['aiAnalysis'] ?? undefined,
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
    expiration_date: link.expirationDate !== undefined && link.expirationDate !== null ? new Date(link.expirationDate).toISOString() : null,
    max_clicks: link.maxClicks ?? null,
    password_hash: link.password ?? null,
    qr_code_data: link.qrCodeData ?? null,
    ai_analysis: link.aiAnalysis ?? null,
    user_id: userId ?? null,
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
  };
}


/**
 * Supabase implementation of the StorageAdapter interface
 */
export class SupabaseAdapter implements StorageAdapter {
  /**
   * Get all links from the database
   */
  async getLinks(): Promise<LinkData[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: linkRows, error } = await supabase!
      .from(TABLES.LINKS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch links: ${error.message}`);
    }

    // Fetch click history for each link
    const links = await Promise.all(
      (linkRows || []).map(async (row: LinkRow) => {
        const clickHistory = await this.getClickEvents(row.id);
        return rowToLinkData(row, clickHistory);
      })
    );

    return links;
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

    const id = uuidv4();
    const rowData = linkDataToRow({ ...link, id }, userId);

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .insert(rowData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create link: ${error.message}`);
    }

    return rowToLinkData(row as LinkRow, link.clickHistory || []);
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
      rowUpdates.expiration_date = updateFields.expirationDate 
        ? new Date(updateFields.expirationDate).toISOString() 
        : null;
    }
    if (updateFields.maxClicks !== undefined) rowUpdates.max_clicks = updateFields.maxClicks ?? null;
    if (updateFields.password !== undefined) rowUpdates.password_hash = updateFields.password ?? null;
    if (updateFields.qrCodeData !== undefined) rowUpdates.qr_code_data = updateFields.qrCodeData ?? null;
    if (updateFields.aiAnalysis !== undefined) rowUpdates.ai_analysis = updateFields.aiAnalysis ?? null;

    const { data: row, error } = await supabase!
      .from(TABLES.LINKS)
      .update(rowUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update link: ${error.message}`);
    }

    const clickHistory = await this.getClickEvents(id);
    return rowToLinkData(row as LinkRow, clickHistory);
  }

  /**
   * Delete a link
   */
  async deleteLink(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase!
      .from(TABLES.LINKS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete link: ${error.message}`);
    }
  }


  /**
   * Record a click event for a link
   */
  async recordClick(linkId: string, event: ClickEventInput): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    // Parse user agent for device and OS
    const { device, os } = parseUserAgent(event.userAgent);
    
    // Get country from IP
    const country = await getCountryFromIP(event.ipAddress);

    // Create click event row
    const clickEventRow = {
      id: uuidv4(),
      link_id: linkId,
      timestamp: new Date(event.timestamp).toISOString(),
      referrer: event.referrer || 'direct',
      device,
      os,
      country,
      raw_user_agent: event.userAgent,
      ip_hash: event.ipAddress ? hashIP(event.ipAddress) : null,
    };

    const { error: clickError } = await supabase!
      .from(TABLES.CLICK_EVENTS)
      .insert(clickEventRow);

    if (clickError) {
      throw new Error(`Failed to record click: ${clickError.message}`);
    }

    // Update link click count and last clicked timestamp
    const { error: updateError } = await supabase!.rpc('increment_link_clicks', {
      link_id: linkId,
      clicked_at: clickEventRow.timestamp,
    });

    // If RPC doesn't exist, fall back to manual update
    if (updateError) {
      const { data: link } = await supabase!
        .from(TABLES.LINKS)
        .select('clicks')
        .eq('id', linkId)
        .single();

      if (link) {
        await supabase!
          .from(TABLES.LINKS)
          .update({
            clicks: (link.clicks || 0) + 1,
            last_clicked_at: clickEventRow.timestamp,
          })
          .eq('id', linkId);
      }
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
