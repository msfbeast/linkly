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

export interface CountryBreakdown {
    country: string;
    clickCount: number;
}

export interface CityBreakdown {
    city: string;
    country: string;
    clickCount: number;
}

export interface DeviceBreakdown {
    device: string;
    clickCount: number;
}

export interface ReferrerBreakdown {
    referrer: string;
    clickCount: number;
}

export interface OsBreakdown {
    os: string;
    clickCount: number;
}

export interface BrowserBreakdown {
    browser: string;
    clickCount: number;
}

export interface DeviceModelBreakdown {
    deviceModel: string;
    clickCount: number;
}

export interface DailyClicks {
    date: string;
    clickCount: number;
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
     * Get ALL analytics data for Global Analytics page
     */
    async getFullAnalytics(userId: string) {
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
            this.getClicksOverTime(userId, 30)
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

