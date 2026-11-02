import { BaseRepository } from './BaseRepository';
import { BioAnalyticsData } from '../../../types';

/** The click columns the CSV export writes (plus id for paging). */
export interface ExportClickRow {
    id: string;
    timestamp: string;
    referrer: string | null;
    device: string | null;
    os: string | null;
    country: string | null;
}

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

        // Counted in the database (get_bio_analytics, from the click rollups);
        // this used to download every click on every link.
        const { data: stats, error: statsError } = await this.supabase!.rpc('get_bio_analytics', { p_days: days });
        if (statsError) throw statsError;
        const bio = stats as {
            total: number;
            daily: { date: string; clicks: number }[];
            devices: { name: string; value: number }[];
            countries: { name: string; value: number }[];
            topLinks: { title: string; shortCode: string; clicks: number }[];
        };

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
        const totalClicks = Number(bio.total) || 0;
        const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100) : 0;

        // Time Series: every day in the window, UTC dates
        const dailyClicks = new Map(bio.daily.map(d => [d.date, Number(d.clicks)]));
        const clicksOverTime: { date: string; clicks: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const date = d.toISOString().split('T')[0];
            clicksOverTime.push({ date, clicks: dailyClicks.get(date) || 0 });
        }

        // Device
        const byDevice = bio.devices.map(d => ({ name: d.name, value: Number(d.value) }));

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

        bio.countries.forEach(c => {
            let loc = (c.name || 'Unknown').trim();
            if (!loc) loc = 'Unknown';

            // Check codes first (case-insensitive)
            const upperLoc = loc.toUpperCase();
            if (codeMap[upperLoc]) {
                loc = codeMap[upperLoc];
            } else if (loc !== 'Unknown') {
                // Ensure Title Case for consistency (e.g. "india" -> "India")
                loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
            }

            locationCount[loc] = (locationCount[loc] || 0) + Number(c.value);
        });

        const byLocation = Object.entries(locationCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5

        // Top Links
        const topLinks = bio.topLinks.map(l => ({
            title: l.title,
            url: `/r/${l.shortCode}`,
            clicks: Number(l.clicks)
        }));

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
        const PRICES = { 'free': 0, 'pro': 12, 'business': 49 };
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

    /**
     * Every click on the given links, with the columns the CSV export writes.
     *
     * Pages through each link newest-first on the (link_id, timestamp) index:
     * each page asks for clicks at or before the last page's oldest timestamp
     * and drops the few already seen at that exact moment. (Adding id as a
     * tie-break in ORDER BY made Postgres sort all of a link's clicks per
     * page: 10 s on a 107k-click link, past the 8 s statement timeout.)
     * Retries a failed page once, then throws rather than returning a
     * partial export.
     */
    async getClickEventsForExport(
        linkIds: string[],
        onProgress?: (rows: number) => void,
    ): Promise<ExportClickRow[]> {
        if (!this.isConfigured() || linkIds.length === 0) return [];
        const PAGE = 2500;
        const CONCURRENCY = 4;
        const all: ExportClickRow[] = [];

        const fetchPage = async (linkId: string, atOrBefore: string | null) => {
            for (let attempt = 0; ; attempt++) {
                let query = this.supabase!
                    .from(STORAGE_KEYS.CLICKS)
                    .select('id, timestamp, referrer, device, os, country')
                    .eq('link_id', linkId)
                    .order('timestamp', { ascending: false })
                    .limit(PAGE);
                if (atOrBefore) query = query.lte('timestamp', atOrBefore);
                const { data, error } = await query;
                if (!error) return (data || []) as ExportClickRow[];
                if (attempt >= 1) throw new Error(`Export failed while reading clicks: ${error.message}`);
            }
        };

        const exportLink = async (linkId: string) => {
            let atOrBefore: string | null = null;
            let seenAtBoundary = new Set<string>();
            for (;;) {
                const page = await fetchPage(linkId, atOrBefore);
                const fresh = page.filter(r => !seenAtBoundary.has(r.id));
                if (page.length === PAGE && fresh.length === 0) {
                    throw new Error('Export failed: too many clicks share one timestamp to page through');
                }
                all.push(...fresh);
                onProgress?.(all.length);
                if (page.length < PAGE) return;
                atOrBefore = page[page.length - 1].timestamp;
                seenAtBoundary = new Set(page.filter(r => r.timestamp === atOrBefore).map(r => r.id));
            }
        };

        const queue = [...linkIds];
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
            for (let id = queue.shift(); id; id = queue.shift()) await exportLink(id);
        }));
        return all;
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
