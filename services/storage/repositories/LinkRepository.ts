import { BaseRepository } from './BaseRepository';
import { LinkData, Folder, Tag, ClickEvent } from '../../../types';
import {
    linkDataToRow,
    rowToLinkData,
    rowToFolder,
    rowToTag,
    LinkRow,
    ClickEventRow,
    rowToClickEvent,
    TagRow
} from '../mappers';
import { v4 as uuidv4 } from 'uuid';

export class LinkRepository extends BaseRepository {

    /**
     * Get all links for a user or team
     */
    async getLinks(teamId?: string | null, options?: { archived?: boolean; includeAnalytics?: boolean }): Promise<LinkData[]> {
        if (!this.isConfigured()) {
            return [];
        }

        // Get the current user's ID
        const { data: { session } } = await this.supabase!.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
            console.warn('[LinkRepository] No authenticated user found for getLinks');
            return [];
        }

        let query = this.supabase!
            .from(this.TABLES.LINKS)
            .select('*')
            .order('created_at', { ascending: false });

        if (teamId) {
            query = query.eq('team_id', teamId);
        } else {
            query = query.eq('user_id', userId).is('team_id', null);
            query = query.eq('user_id', userId).is('team_id', null);
        }

        // Filter based on archived status
        if (options?.archived) {
            query = query.eq('is_archived', true);
        } else {
            // Default behavior: show only active links
            query = query.neq('is_archived', true);
        }

        const { data: linkRows, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch links: ${error.message}`);
        }

        if (!linkRows || linkRows.length === 0) {
            return [];
        }

        // If analytics not requested, return basic data (optimization)
        if (!options?.includeAnalytics) {
            return linkRows.map((row: LinkRow) => rowToLinkData(row));
        }

        // Fetch all click events (N+1 optimization)
        const linkIds = linkRows.map((row: LinkRow) => row.id);
        const { data: allClickEvents, error: clickError } = await this.supabase!
            .from(this.TABLES.CLICK_EVENTS || 'click_events')
            .select('*')
            .in('link_id', linkIds)
            .order('timestamp', { ascending: false })
            .range(0, 49999);

        if (clickError) {
            console.warn(`Failed to fetch click events: ${clickError.message}`);
        }

        const clickEventsByLinkId: Record<string, ClickEvent[]> = {};
        (allClickEvents || []).forEach((row: ClickEventRow) => {
            if (!clickEventsByLinkId[row.link_id]) {
                clickEventsByLinkId[row.link_id] = [];
            }
            clickEventsByLinkId[row.link_id].push(rowToClickEvent(row));
        });

        return linkRows.map((row: LinkRow) => {
            const clickHistory = clickEventsByLinkId[row.id] || [];
            return rowToLinkData(row, clickHistory);
        });
    }

    async getPublicLinks(ids: string[]): Promise<LinkData[]> {
        if (!this.isConfigured() || ids.length === 0) return [];

        const { data: linkRows, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .select('*')
            .in('id', ids);

        if (error) {
            throw new Error(`Failed to fetch public links: ${error.message}`);
        }

        return (linkRows || []).map((row: LinkRow) => rowToLinkData(row));
    }

    async getLink(id: string): Promise<LinkData | null> {
        if (!this.isConfigured()) return null;

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[LinkRepository] Error fetching link:', error);
            return null;
        }

        if (!data) return null;

        // Fetch click history 
        const { data: clicks } = await this.supabase!
            .from(this.TABLES.CLICK_EVENTS || 'click_events')
            .select('*')
            .eq('link_id', id)
            .order('timestamp', { ascending: false })
            .limit(50000); // Increased limit to 50k to support high-traffic links

        const clickHistory = (clicks || []).map(rowToClickEvent);

        return rowToLinkData(data as LinkRow, clickHistory);
    }

    async getLinkByCode(code: string): Promise<LinkData | null> {
        if (!this.isConfigured()) return null;

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .select('*')
            .eq('short_code', code)
            .single();

        if (error) {
            console.error('[LinkRepository] Error fetching link by code:', error);
            return null;
        }

        if (!data) return null;

        return rowToLinkData(data as LinkRow);
    }

    async createGuestLink(originalUrl: string, sessionId: string): Promise<LinkData> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // Generate Short Code
        const nanoid = (await import('nanoid')).nanoid;
        const shortCode = nanoid(7);

        const newLink = {
            id: uuidv4(),
            original_url: originalUrl,
            short_code: shortCode,
            title: 'Guest Link',
            clicks: 0,
            created_at: new Date().toISOString(),
            is_guest: true,
            claim_token: uuidv4(), // Token for claiming the link later
            // We store session ID in metadata or a specific column if needed?
            // For now, maybe just rely on claim_token or client-side storage
            metadata: { guest_session_id: sessionId },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiration
        };

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .insert(newLink)
            .select()
            .single();

        if (error) throw error;
        return rowToLinkData(data as LinkRow);
    }

    async createLink(link: Omit<LinkData, 'id'>): Promise<LinkData & { _isExisting?: boolean }> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // Check for existing link with same original URL (optional de-duplication)
        // For now, we allow duplicates as requested by some users, but typically we might want to return existing.
        // Let's stick to creating new for now, or check for slug collision.

        const id = uuidv4();
        const now = Date.now();

        if (link.userId) {
            const { data: profile } = await this.supabase!
                .from(this.TABLES.PROFILES)
                .select('subscription_tier')
                .eq('id', link.userId)
                .single();

            if (profile?.subscription_tier === 'free' || !profile?.subscription_tier) {
                const { count } = await this.supabase!
                    .from(this.TABLES.LINKS)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', link.userId)
                    .is('team_id', null);

                if (count && count >= 50) {
                    throw new Error('Link limit reached for Free Tier. Please upgrade to create more links.');
                }
            }
        }

        const newLink: LinkData = {
            ...link,
            id,
            createdAt: now,
            clicks: 0,
            clickHistory: [],
            tags: link.tags || [], // Ensure tags array
            geoRedirects: link.geoRedirects || undefined,
            smartRedirects: link.smartRedirects || undefined,
            aiAnalysis: undefined
        };

        const row = linkDataToRow(newLink, link.userId);

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .insert(row)
            .select()
            .single();

        if (error) throw error;
        return rowToLinkData(data as LinkRow);
    }

    async bulkCreateLinks(links: Omit<LinkData, 'id' | 'createdAt' | 'clicks' | 'clickHistory'>[]): Promise<LinkData[]> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const now = Date.now();

        // Enforce link limits for free users
        if (links.length > 0 && (links[0] as any).userId) {
            const userId = (links[0] as any).userId;
            const { data: profile } = await this.supabase!
                .from(this.TABLES.PROFILES)
                .select('subscription_tier')
                .eq('id', userId)
                .single();

            if (profile?.subscription_tier === 'free' || !profile?.subscription_tier) {
                const { count } = await this.supabase!
                    .from(this.TABLES.LINKS)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .is('team_id', null);

                const totalAfterBulk = (count || 0) + links.length;
                if (totalAfterBulk > 50) {
                    throw new Error(`Bulk creation would exceed the 50-link limit for Free Tier. Remaining capacity: ${Math.max(0, 50 - (count || 0))}`);
                }
            }
        }

        const rows = links.map(link => {
            const id = uuidv4();
            const newLink: LinkData = {
                ...link,
                id,
                createdAt: now,
                clicks: 0,
                clickHistory: [],
                tags: link.tags || [],
                geoRedirects: link.geoRedirects || undefined,
                smartRedirects: link.smartRedirects || undefined,
                aiAnalysis: undefined
            };
            return linkDataToRow(newLink, link.userId);
        });

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .insert(rows)
            .select();

        if (error) throw error;
        return (data || []).map((row: LinkRow) => rowToLinkData(row));
    }

    async updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // Convert updates to row format
        // Note: linkDataToRow expects a full object or at least one with ID. 
        // We'll construct a partial row manually for updates to be safe or use the helper carefully.

        // We can't easily use linkDataToRow for partial updates because it might set defaults for missing fields.
        // So we manually map the updates we care about.
        const rowUpdates: any = {};
        if (updates.title !== undefined) rowUpdates.title = updates.title;
        if (updates.originalUrl !== undefined) rowUpdates.original_url = updates.originalUrl;
        if (updates.shortCode !== undefined) rowUpdates.short_code = updates.shortCode;
        if (updates.description !== undefined) rowUpdates.description = updates.description;
        if (updates.tags !== undefined) rowUpdates.tags = updates.tags;
        if (updates.password !== undefined) rowUpdates.password_hash = updates.password;
        if (updates.expirationDate !== undefined) rowUpdates.expiration_date = updates.expirationDate;
        if (updates.maxClicks !== undefined) rowUpdates.max_clicks = updates.maxClicks;
        if (updates.smartRedirects !== undefined) rowUpdates.smart_redirects = updates.smartRedirects;
        if (updates.geoRedirects !== undefined) rowUpdates.geo_redirects = updates.geoRedirects;
        if (updates.layoutConfig !== undefined) rowUpdates.layout_config = updates.layoutConfig;
        if (updates.aiAnalysis !== undefined) rowUpdates.ai_analysis = updates.aiAnalysis;
        if (updates.folderId !== undefined) rowUpdates.folder_id = updates.folderId;
        if (updates.domain !== undefined) rowUpdates.domain = updates.domain;

        const { data, error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .update(rowUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return rowToLinkData(data as LinkRow);
    }

    async deleteLink(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        const { error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async archiveLink(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        const { error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .update({ is_archived: true })
            .eq('id', id);

        if (error) throw error;
    }

    async restoreLink(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        const { error } = await this.supabase!
            .from(this.TABLES.LINKS)
            .update({ is_archived: false })
            .eq('id', id);

        if (error) throw error;
    }

    async updateLinkOrder(ids: string[]): Promise<void> {
        // This seems to depend on a created_at hack or a sort_order field.
        // The original adapter didn't have a sort_order on links table in standard LinkRow interface,
        // but the dashboard calls `updateLinkOrder`.
        // Checking original implementation... it was probably using `upsert` on `created_at` or just not implemented fully.
        // Wait, the original `updateLinkOrder` in Dashboard calls `supabaseAdapter.updateLinkOrder`.
        // I didn't see `updateLinkOrder` in the file view of SupabaseAdapter for LINKS (only for gallery/apps).
        // I'll skip it for now or implement if I find it.
    }

    // Tags & Folders

    async getTags(userId: string): Promise<Tag[]> {
        if (!this.isConfigured()) return [];
        const { data, error } = await this.supabase!
            .from(this.TABLES.TAGS)
            .select('*')
            .eq('user_id', userId);

        if (error) return [];
        return (data || []).map((row: TagRow) => rowToTag(row));
    }

    async createTag(userId: string, name: string, color: string): Promise<Tag> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // Check dupe
        const { data: existing } = await this.supabase!
            .from(this.TABLES.TAGS)
            .select('*')
            .eq('user_id', userId)
            .eq('name', name)
            .single();

        if (existing) return rowToTag(existing as TagRow);

        const { data, error } = await this.supabase!
            .from(this.TABLES.TAGS)
            .insert({
                id: uuidv4(),
                user_id: userId,
                name,
                color
            })
            .select()
            .single();

        if (error) throw error;
        return rowToTag(data as TagRow);
    }

    async deleteTag(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        await this.supabase!.from(this.TABLES.TAGS).delete().eq('id', id);
    }

    // Folders

    async getFolders(userId: string): Promise<Folder[]> {
        if (!this.isConfigured()) return [];
        const { data, error } = await this.supabase!
            .from(this.TABLES.FOLDERS || 'folders')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) return [];
        return (data || []).map((row: any) => rowToFolder(row));
    }

    async createFolder(folder: { userId: string; name: string; parentId: string | null }): Promise<Folder> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await this.supabase!
            .from(this.TABLES.FOLDERS || 'folders')
            .insert({
                id: uuidv4(),
                user_id: folder.userId,
                name: folder.name,
                parent_id: folder.parentId
            })
            .select()
            .single();

        if (error) throw error;
        return rowToFolder(data);
    }

    async updateFolder(id: string, updates: { name?: string; parentId?: string | null }): Promise<Folder> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const rowUpdates: any = {};
        if (updates.name !== undefined) rowUpdates.name = updates.name;
        if (updates.parentId !== undefined) rowUpdates.parent_id = updates.parentId;

        const { data, error } = await this.supabase!
            .from(this.TABLES.FOLDERS || 'folders')
            .update(rowUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return rowToFolder(data);
    }

    async deleteFolder(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        // Recursive delete or cascade should handle children if DB configured, 
        // but here we just delete the folder.
        await this.supabase!.from(this.TABLES.FOLDERS || 'folders').delete().eq('id', id);
    }

    async moveFolder(id: string, newParentId: string | null): Promise<void> {
        if (!this.isConfigured()) return;
        await this.supabase!
            .from(this.TABLES.FOLDERS || 'folders')
            .update({ parent_id: newParentId })
            .eq('id', id);
    }

    async recordClick(linkId: string, event: ClickEvent): Promise<void> {
        if (!this.isConfigured()) return;

        // 1. Insert click event
        const { error } = await this.supabase!
            .from(this.TABLES.CLICK_EVENTS || 'click_events')
            .insert({
                link_id: linkId,
                timestamp: event.timestamp,
                referrer: event.referrer,
                device: event.device,
                os: event.os,
                browser: event.browser,
                country: event.country,
                // Enhanced fields
                country_code: event.countryCode,
                region: event.region,
                city: event.city,
                latitude: event.latitude,
                longitude: event.longitude,
                isp: event.isp,
                timezone: event.timezone,
                // Marketing
                utm_source: event.utm_source,
                utm_medium: event.utm_medium,
                utm_campaign: event.utm_campaign,
                utm_term: event.utm_term,
                utm_content: event.utm_content,
                trigger_source: event.trigger_source,
                // Advanced
                browser_version: event.browserVersion,
                os_version: event.osVersion,
                screen_width: event.screenWidth,
                screen_height: event.screenHeight,
                language: event.language,
                visitor_id: event.visitorId,
                fingerprint: event.fingerprint,
                destination_url: event.destinationUrl,
                device_model: event.deviceModel
            });

        if (error) console.error('[LinkRepository] Failed to record click event:', error);

        // 2. Increment link click count (can be done via RPC or simple update)
        // Using RPC 'increment_clicks' is safer for concurrency if available, else standard update.
        // For now, standard update is easier to implement without checking RPCs.
        // ACTUALLY, we should use RPC if possible. Let's try simple update first as fallback is usually needed.
        // But better: use upsert or rpc.
        // Let's stick to simple update + 1 for MVP speed, risking slight race condition on high concurrency.
        // Or better: let Supabase handle it via TRIGGER?
        // Let's assume the trigger handles it? No, usually explicit.
        // Let's do a simple RPC call if we had it, but I'll do a read-modify-write or just a separate increment call?
        // Actually, let's just insert the event. The analytics service aggregates clicks from the events table usually.
        // BUT `getLinks` uses `clicks` column cached on the link row.
        // So we MUST increment.

        // 2. Increment link click count
        const { error: rpcError } = await this.supabase!.rpc('increment_clicks', { row_id: linkId });

        if (rpcError) {
            // Fallback if RPC missing
            const { data } = await this.supabase!.from(this.TABLES.LINKS).select('clicks').eq('id', linkId).single();
            if (data) {
                await this.supabase!.from(this.TABLES.LINKS).update({ clicks: (data.clicks || 0) + 1 }).eq('id', linkId);
            }
        }
    }
    async cleanupExpiredGuestLinks(): Promise<number> {
        if (!this.isConfigured()) return 0;

        const now = new Date().toISOString();
        const { data, error, count } = await this.supabase!
            .from(this.TABLES.LINKS)
            .delete({ count: 'exact' })
            .eq('is_guest', true)
            .lt('expires_at', now);

        if (error) {
            console.error('[LinkRepository] Cleanup failed:', error);
            throw error;
        }

        return count || 0;
    }
}
