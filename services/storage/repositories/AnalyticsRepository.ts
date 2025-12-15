import { BaseRepository } from './BaseRepository';
import { BioAnalyticsData } from '../../../types';

const STORAGE_KEYS = {
    CLICKS: 'click_events',
};

export class AnalyticsRepository extends BaseRepository {

    async getBioAnalytics(userId: string, days = 30): Promise<BioAnalyticsData> {
        if (!this.isConfigured()) {
            return {
                overview: { totalViews: 0, totalClicks: 0, ctr: 0, totalSubscribers: 0 },
                clicksOverTime: [],
                byDevice: [],
                byLocation: [],
                topLinks: []
            };
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Fetch User's Links
        const { data: links } = await this.supabase!
            .from('links')
            .select('id, title, short_code')
            .eq('user_id', userId);

        const linkIds = links?.map(l => l.id) || [];

        // 2. Fetch Click Events for these links
        const clicks: any[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < linkIds.length; i += BATCH_SIZE) {
            const batch = linkIds.slice(i, i + BATCH_SIZE);
            const { data: batchClicks, error } = await this.supabase!
                .from(STORAGE_KEYS.CLICKS)
                .select('*')
                .in('link_id', batch);

            if (error) {
                console.error('Error fetching click batch:', JSON.stringify(error));
            }

            if (batchClicks) {
                clicks.push(...batchClicks);
            }
        }

        // 3. Fetch Subscriber Count
        const { count: subscriberCount } = await this.supabase!
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // 4. Fetch Profile Views
        const { data: profiles } = await this.supabase!
            .from('bio_profiles')
            .select('views')
            .eq('user_id', userId);

        const totalViews = profiles?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;

        // Aggregation
        const totalClicks = clicks?.length || 0;
        const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100) : 0;

        // Time Series
        const clicksByDate = new Map<string, number>();
        // Initialize dates
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            clicksByDate.set(d.toISOString().split('T')[0], 0);
        }

        clicks?.forEach(c => {
            try {
                if (!c.timestamp) return;
                const d = new Date(c.timestamp);
                if (isNaN(d.getTime())) return;

                const date = d.toISOString().split('T')[0];
                if (clicksByDate.has(date)) {
                    clicksByDate.set(date, (clicksByDate.get(date) || 0) + 1);
                }
            } catch (e) {
                // Ignore invalid dates
            }
        });

        const clicksOverTime = Array.from(clicksByDate.entries())
            .map(([date, clicks]) => ({ date, clicks }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Device
        const deviceCount: Record<string, number> = {};
        clicks?.forEach(c => {
            const device = c.device || 'unknown';
            deviceCount[device] = (deviceCount[device] || 0) + 1;
        });
        const byDevice = Object.entries(deviceCount).map(([name, value]) => ({ name, value }));

        // Location
        const locationCount: Record<string, number> = {};
        const codeMap: Record<string, string> = {
            'IN': 'India',
            'US': 'United States', 'USA': 'United States',
            'GB': 'United Kingdom', 'UK': 'United Kingdom',
            'CA': 'Canada',
            'AU': 'Australia',
            'DE': 'Germany',
            'FR': 'France',
            'ES': 'Spain',
            'IT': 'Italy',
            'JP': 'Japan',
            'BR': 'Brazil',
            'RU': 'Russia',
            'CN': 'China',
            'NL': 'Netherlands',
            'SG': 'Singapore'
        };

        clicks?.forEach(c => {
            let loc = (c.country || 'Unknown').trim();

            // Skip empty stats
            if (!loc) {
                loc = 'Unknown';
            }

            // Check codes first (case-insensitive)
            const upperLoc = loc.toUpperCase();
            if (codeMap[upperLoc]) {
                loc = codeMap[upperLoc];
            } else if (loc !== 'Unknown') {
                // Ensure Title Case for consistency (e.g. "india" -> "India")
                loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
            }

            locationCount[loc] = (locationCount[loc] || 0) + 1;
        });

        const byLocation = Object.entries(locationCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        // Top Links
        const linkClicks: Record<string, number> = {};
        clicks?.forEach(c => {
            if (c.link_id) linkClicks[c.link_id] = (linkClicks[c.link_id] || 0) + 1;
        });

        const topLinks = links?.map(l => ({
            title: l.title,
            url: `/r/${l.short_code}`,
            clicks: linkClicks[l.id] || 0
        }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5) || [];

        return {
            overview: {
                totalViews,
                totalClicks,
                ctr: parseFloat(ctr.toFixed(1)),
                totalSubscribers: subscriberCount || 0
            },
            clicksOverTime,
            byDevice,
            byLocation,
            topLinks
        };
    }

    async getAnalyticsSummary(linkId: string, startDate: string, endDate: string) {
        const { data, error } = await this.supabase!
            .from('analytics_daily_summary')
            .select('*')
            .eq('link_id', linkId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    }

    async getPlatformStats(): Promise<{
        totalUsers: number;
        activeSubscriptions: number;
        totalRevenue: number;
        totalLinks: number;
        userGrowth: number; // Percentage
        linkGrowth: number; // Percentage
        systemHealth: number; // 0-100
    }> {
        if (!this.isConfigured()) return {
            totalUsers: 0, activeSubscriptions: 0, totalRevenue: 0, totalLinks: 0, userGrowth: 0, linkGrowth: 0, systemHealth: 0
        };

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthISO = startOfMonth.toISOString();

        // Parallel requests for performance
        const [
            { count: totalUsers, error: usersError },
            { count: activeSubs, error: subsError },
            { count: totalLinks, error: linksError },
            { data: revenueProfiles },
            { count: newUsers, error: newUsersError },
            { count: newLinks, error: newLinksError }
        ] = await Promise.all([
            this.supabase!.from('profiles').select('*', { count: 'exact', head: true }),
            this.supabase!.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
            this.supabase!.from('links').select('*', { count: 'exact', head: true }),
            this.supabase!.from('profiles').select('subscription_tier').eq('subscription_status', 'active'),
            this.supabase!.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonthISO), // created_at might not exist on profiles, usually on auth.users but profiles triggers? Assuming updated_at or similar or using auth join which is hard. Use specific table field if available.
            this.supabase!.from('links').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonthISO)
        ]);

        // Revenue Calculation (Estimate)
        const PRICES = { 'starter': 9, 'pro': 29, 'premium': 49, 'business': 99 };
        let totalRevenue = 0;
        revenueProfiles?.forEach((p: any) => {
            const tier = p.subscription_tier as keyof typeof PRICES;
            if (PRICES[tier]) totalRevenue += PRICES[tier];
        });

        // Growth Calculation (Simple Month-to-Date approximation)
        // If we want accurate "vs last month", we need last month's data. 
        // For MVP "Placeholder replacement", current month *pro-rated* or just count is better than static.
        // We returns raw counts of new users/links as "growth" for now or calculate % if we had totals.
        // Let's return raw numbers or percentages relative to total.
        const userGrowth = totalUsers ? ((newUsers || 0) / totalUsers) * 100 : 0;
        const linkGrowth = totalLinks ? ((newLinks || 0) / totalLinks) * 100 : 0;

        // System Health
        // If we got here, DB is reachable.
        const systemHealth = (!usersError && !linksError) ? 100 : 50;

        return {
            totalUsers: totalUsers || 0,
            activeSubscriptions: activeSubs || 0,
            totalRevenue,
            totalLinks: totalLinks || 0,
            userGrowth,
            linkGrowth,
            systemHealth
        };
    }

    async getAllUserClickEvents(userId: string): Promise<any[]> {
        if (!this.isConfigured()) return [];

        // 1. Get all link IDs
        const { data: links } = await this.supabase!
            .from('links')
            .select('id')
            .eq('user_id', userId);

        const linkIds = links?.map(l => l.id) || [];
        if (linkIds.length === 0) return [];

        // 2. Fetch all events (batched if necessary, but for export we try to get all)
        // Note: For very large datasets, this should be paginated or streamed. 
        // For MVP, simplistic fetch is fine but maybe strict batching is safer.
        const allClicks: any[] = [];
        const BATCH_SIZE = 20; // larger batch for export

        for (let i = 0; i < linkIds.length; i += BATCH_SIZE) {
            const batch = linkIds.slice(i, i + BATCH_SIZE);
            const { data: batchClicks, error } = await this.supabase!
                .from(STORAGE_KEYS.CLICKS)
                .select('*')
                .in('link_id', batch);

            if (!error && batchClicks) {
                allClicks.push(...batchClicks);
            }
        }

        return allClicks;
    }

    async runAggregation(): Promise<void> {
        if (!this.isConfigured()) return;
        const { error } = await this.supabase!.rpc('aggregate_daily_stats');
        if (error) {
            console.error('Aggregation failed:', error);
            throw error;
        }
    }
}
