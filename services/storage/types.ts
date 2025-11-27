import { LinkData, ClickEvent } from '../../types';

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions {
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

/**
 * Input data for recording a click event
 */
export interface ClickEventInput {
  timestamp: number;
  referrer: string;
  userAgent: string;
  ipAddress: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  trigger_source?: string;
}

/**
 * Aggregated click data for analytics
 */
export interface AggregatedClickData {
  period: string;
  clicks: number;
  uniqueVisitors: number;
  topReferrers: { name: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
}

/**
 * Export data structure for bulk data export
 */
export interface ExportData {
  links: LinkData[];
  clickEvents: ClickEvent[];
  exportedAt: number;
}

/**
 * Storage adapter interface for abstracting storage backends
 * Supports Supabase, Firebase, or custom API implementations
 */
export interface StorageAdapter {
  // Link operations
  getLinks(): Promise<LinkData[]>;
  getLink(id: string): Promise<LinkData | null>;
  getLinkByCode(shortCode: string): Promise<LinkData | null>;
  createLink(link: Omit<LinkData, 'id'>): Promise<LinkData>;
  updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData>;
  deleteLink(id: string): Promise<void>;

  // Click event operations
  recordClick(linkId: string, event: ClickEventInput): Promise<void>;
  getClickEvents(linkId: string, options?: QueryOptions): Promise<ClickEvent[]>;
  getAggregatedClicks(linkId: string, groupBy: 'day' | 'week' | 'month'): Promise<AggregatedClickData[]>;

  // Bulk operations
  exportAllData(): Promise<ExportData>;
}
