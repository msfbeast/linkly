/**
 * Aggregated Analytics Service
 * 
 * Uses Supabase RPC functions to aggregate click data server-side
 * instead of fetching all rows to the client.
 * 
 * This is required for scalability (100k+ clicks)
 */

import { supabase, isSupabaseConfigured } from './storage/supabaseClient';

export interface UserClickStats {
    totalClicks: number;
    uniqueVisitors: number;
    clicksToday: number;
    clicksThisWeek: number;
    clicksThisMonth: number;
}

export interface ClickTrend {
    day: string;
    clickCount: number;
}

export interface CityStats {
    city: string;
    country: string;
    clickCount: number;
    percentage: number;
}

export interface TrafficSource {
    source: string;
    clickCount: number;
    percentage: number;
}

export interface DeviceBreakdown {
    device: string;
    browser: string;
    clickCount: number;
    percentage: number;
}

export interface LinkStats {
    totalClicks: number;
    uniqueVisitors: number;
    topCountry: string | null;
    topCity: string | null;
    topReferrer: string | null;
    clicksByDay: { day: string; count: number }[];
}

class AggregatedAnalyticsService {
    /**
     * Get aggregated click statistics for a user
     */
    async getUserClickStats(userId: string): Promise<UserClickStats | null> {
        console.log('[AggregatedAnalytics] getUserClickStats called for userId:', userId);

        if (!isSupabaseConfigured() || !supabase) {
            console.error('[AggregatedAnalytics] Supabase not configured');
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('get_user_click_stats', {
                p_user_id: userId
            });

            console.log('[AggregatedAnalytics] RPC response:', { data, error });

            if (error) {
                console.error('[AggregatedAnalytics] getUserClickStats error:', error);
                return null;
            }

            if (!data || !data[0]) {
                console.warn('[AggregatedAnalytics] No data returned from RPC');
                return null;
            }

            const row = data[0];
            const stats = {
                totalClicks: row.total_clicks || 0,
                uniqueVisitors: row.unique_visitors || 0,
                clicksToday: row.clicks_today || 0,
                clicksThisWeek: row.clicks_this_week || 0,
                clicksThisMonth: row.clicks_this_month || 0,
            };
            console.log('[AggregatedAnalytics] Returning stats:', stats);
            return stats;
        } catch (err) {
            console.error('[AggregatedAnalytics] Exception calling RPC:', err);
            return null;
        }
    }

    /**
     * Get click trends by day for charts
     */
    async getClickTrends(userId: string, days: number = 30): Promise<ClickTrend[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        const { data, error } = await supabase.rpc('get_click_trends', {
            p_user_id: userId,
            p_days: days
        });

        if (error) {
            console.error('[AggregatedAnalytics] getClickTrends error:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            day: row.day,
            clickCount: row.click_count || 0,
        }));
    }

    /**
     * Get top cities with click counts
     */
    async getTopCities(userId: string, limit: number = 10): Promise<CityStats[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        const { data, error } = await supabase.rpc('get_top_cities', {
            p_user_id: userId,
            p_limit: limit
        });

        if (error) {
            console.error('[AggregatedAnalytics] getTopCities error:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            city: decodeURIComponent(row.city || 'Unknown'),
            country: row.country || 'Unknown',
            clickCount: row.click_count || 0,
            percentage: row.percentage || 0,
        }));
    }

    /**
     * Get traffic sources breakdown
     */
    async getTrafficSources(userId: string): Promise<TrafficSource[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        const { data, error } = await supabase.rpc('get_traffic_sources', {
            p_user_id: userId
        });

        if (error) {
            console.error('[AggregatedAnalytics] getTrafficSources error:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            source: row.source || 'Unknown',
            clickCount: row.click_count || 0,
            percentage: row.percentage || 0,
        }));
    }

    /**
     * Get device and browser breakdown
     */
    async getDeviceBreakdown(userId: string): Promise<DeviceBreakdown[]> {
        if (!isSupabaseConfigured() || !supabase) return [];

        const { data, error } = await supabase.rpc('get_device_breakdown', {
            p_user_id: userId
        });

        if (error) {
            console.error('[AggregatedAnalytics] getDeviceBreakdown error:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            device: row.device || 'Unknown',
            browser: row.browser || 'Unknown',
            clickCount: row.click_count || 0,
            percentage: row.percentage || 0,
        }));
    }

    /**
     * Get stats for a specific link
     */
    async getLinkStats(linkId: string): Promise<LinkStats | null> {
        console.log('[AggregatedAnalytics] getLinkStats called for linkId:', linkId);

        if (!isSupabaseConfigured() || !supabase) {
            console.error('[AggregatedAnalytics] Supabase not configured');
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('get_link_stats', {
                p_link_id: linkId
            });

            console.log('[AggregatedAnalytics] getLinkStats RPC response:', { data, error });

            if (error) {
                console.error('[AggregatedAnalytics] getLinkStats error:', error);
                return null;
            }

            if (!data || !data[0]) {
                console.warn('[AggregatedAnalytics] getLinkStats: No data returned');
                return null;
            }

            const row = data[0];
            const stats = {
                totalClicks: row.total_clicks || 0,
                uniqueVisitors: row.unique_visitors || 0,
                topCountry: row.top_country,
                topCity: row.top_city ? decodeURIComponent(row.top_city) : null,
                topReferrer: row.top_referrer,
                clicksByDay: row.clicks_by_day || [],
            };
            console.log('[AggregatedAnalytics] getLinkStats returning:', stats);
            return stats;
        } catch (err) {
            console.error('[AggregatedAnalytics] getLinkStats exception:', err);
            return null;
        }
    }
}

export const aggregatedAnalytics = new AggregatedAnalyticsService();
