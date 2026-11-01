/**
 * Aggregated Analytics Service
 * 
 * Uses Supabase RPC functions to aggregate click data server-side
 * instead of fetching all rows to the client.
 * 
 * This is required for scalability (100k+ clicks)
 */

import { supabase, isSupabaseConfigured } from './storage/supabaseClient';

import { UserClickStats, CountryBreakdown, CityBreakdown, DeviceBreakdown, ReferrerBreakdown, OsBreakdown, BrowserBreakdown, DeviceModelBreakdown, DailyClicks, LinkStats, LinkAnalytics, LinkAnalyticsRange, ClickEvent } from '../types';
import { rowToClickEvent } from './storage/mappers';
import type { ClickEventRow } from './storage/mappers';

// Columns the link page's click table and CSV export use.
const LINK_CLICK_COLUMNS = 'timestamp, country, city, device, os, browser, referrer, visitor_id';

class AggregatedAnalyticsService {
    /**
     * Get aggregated click statistics for a user
     */
    async getUserClickStats(userId: string): Promise<UserClickStats | null> {
        if (!isSupabaseConfigured() || !supabase) return null;

        try {
            const { data, error } = await supabase.rpc('get_user_click_stats', {
                p_user_id: userId
            });

            if (error || !data?.[0]) return null;

            const row = data[0];
            return {
                totalClicks: row.total_clicks || 0,
                uniqueVisitors: row.unique_visitors || 0,
                clicksToday: row.clicks_today || 0,
                clicksThisWeek: row.clicks_this_week || 0,
                clicksLastWeek: row.clicks_last_week || 0,
                clicksThisMonth: row.clicks_this_month || 0,
            };
        } catch {
            return null;
        }
    }

    /**
     * Get country breakdown
     */
    async getCountryBreakdown(userId: string): Promise<CountryBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_country_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                country: row.country || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get city breakdown
     */
    async getCityBreakdown(userId: string): Promise<CityBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_city_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                city: row.city || 'Unknown',
                country: row.country || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get device breakdown
     */
    async getDeviceBreakdown(userId: string): Promise<DeviceBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_device_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                device: row.device || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get referrer/traffic source breakdown
     */
    async getReferrerBreakdown(userId: string): Promise<ReferrerBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_referrer_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                referrer: row.referrer || 'Direct',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get OS breakdown
     */
    async getOsBreakdown(userId: string): Promise<OsBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_os_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                os: row.os || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get browser breakdown
     */
    async getBrowserBreakdown(userId: string): Promise<BrowserBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_browser_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                browser: row.browser || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get device model breakdown
     */
    async getDeviceModelBreakdown(userId: string): Promise<DeviceModelBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_device_model_breakdown', {
                p_user_id: userId
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                deviceModel: row.device_model || 'Unknown',
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get clicks over time
     */
    async getClicksOverTime(userId: string, days: number = 30): Promise<DailyClicks[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        try {
            const { data, error } = await supabase.rpc('get_user_clicks_over_time', {
                p_user_id: userId,
                p_days: days
            });

            if (error) return [];

            return (data || []).map((row: any) => ({
                date: row.click_date,
                clickCount: Number(row.click_count) || 0,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Get stats for a specific link
     */
    async getLinkStats(linkId: string): Promise<LinkStats | null> {
        if (!isSupabaseConfigured() || !supabase) return null;

        try {
            const { data, error } = await supabase.rpc('get_link_stats', {
                p_link_id: linkId
            });

            if (error || !data?.[0]) return null;

            const row = data[0];
            return {
                totalClicks: row.total_clicks || 0,
                uniqueVisitors: row.unique_visitors || 0,
                topCountry: row.top_country,
                topCity: row.top_city ? decodeURIComponent(row.top_city) : null,
                topReferrer: row.top_referrer,
                clicksByDay: row.clicks_by_day || [],
            };
        } catch {
            return null;
        }
    }

    /**
     * Everything the link analytics page shows for one time range, counted on
     * the server in the viewer's time zone. Throws on failure so the page can
     * say so instead of showing zeros.
     */
    async getLinkAnalytics(linkId: string, range: LinkAnalyticsRange, timeZone: string): Promise<LinkAnalytics> {
        if (!isSupabaseConfigured() || !supabase) throw new Error('Analytics unavailable');
        const { data, error } = await supabase.rpc('get_link_analytics', {
            p_link_id: linkId,
            p_range: range,
            p_tz: timeZone,
        });
        if (error) throw error;
        const a = data as LinkAnalytics;
        return { ...a, previousTotal: a.previousTotal ?? 0, previousUnique: a.previousUnique ?? 0 };
    }

    /** One page of a link's clicks, newest first, optionally only since a time. */
    async getLinkClicksPage(linkId: string, sinceMs: number | null, offset: number, limit: number): Promise<ClickEvent[]> {
        if (!isSupabaseConfigured() || !supabase) return [];
        let query = supabase
            .from('click_events')
            .select(LINK_CLICK_COLUMNS)
            .eq('link_id', linkId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
        if (sinceMs !== null) query = query.gte('timestamp', new Date(sinceMs).toISOString());
        const { data, error } = await query;
        if (error) throw error;
        return ((data || []) as unknown as ClickEventRow[]).map(rowToClickEvent);
    }

    /** Every click in the range, fetched in batches (for CSV export). */
    async getAllLinkClicks(linkId: string, sinceMs: number | null): Promise<ClickEvent[]> {
        const batch = 10000;
        const all: ClickEvent[] = [];
        for (let offset = 0; ; offset += batch) {
            const page = await this.getLinkClicksPage(linkId, sinceMs, offset, batch);
            all.push(...page);
            if (page.length < batch) return all;
        }
    }

    /**
     * Get ALL analytics data for Global Analytics page
     */
    async getFullAnalytics(userId: string, days: number = 30) {
        const [
            stats,
            countries,
            cities,
            devices,
            referrers,
            browsers,
            deviceModels,
            clicksOverTime
        ] = await Promise.all([
            this.getUserClickStats(userId),
            this.getCountryBreakdown(userId),
            this.getCityBreakdown(userId),
            this.getDeviceBreakdown(userId),
            this.getReferrerBreakdown(userId),
            this.getBrowserBreakdown(userId),
            this.getDeviceModelBreakdown(userId),
            this.getClicksOverTime(userId, days)
        ]);

        return {
            stats,
            countries,
            cities,
            devices,
            referrers,
            browsers,
            deviceModels,
            clicksOverTime
        };
    }
}

export const aggregatedAnalytics = new AggregatedAnalyticsService();

