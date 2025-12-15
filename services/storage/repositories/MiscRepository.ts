import { BaseRepository } from './BaseRepository';
import {
    AppRecommendation,
    TechVaultItem,
    NewsletterSubscriber
} from '../../../types';
import {
    rowToAppRecommendation,
    rowToTechVaultItem,
    rowToNewsletterSubscriber
} from '../mappers';
import { BUCKETS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from '../../../utils/imageUtils';

export class MiscRepository extends BaseRepository {

    // ============================================
    // Newsletter Methods
    // ============================================

    async addSubscriber(userId: string, email: string): Promise<void> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { error } = await this.supabase!
            .from('newsletter_subscribers')
            .insert({
                user_id: userId,
                email: email
            });

        if (error) {
            if (error.code === '23505') return; // Ignore unique violation
            console.error('Error adding subscriber:', error);
            throw error;
        }
    }

    async getSubscribers(userId: string): Promise<NewsletterSubscriber[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
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
        if (!this.isConfigured()) throw new Error('Supabase not configured');
        const { error } = await this.supabase!
            .from('newsletter_subscribers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // ==========================================
    // App Stack (What's On My Phone)
    // ==========================================

    async getApps(userId: string): Promise<AppRecommendation[]> {
        if (!this.isConfigured()) return [];
        const { data, error } = await this.supabase!
            .from('app_recommendations')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(rowToAppRecommendation);
    }

    async addApp(userId: string, app: Omit<AppRecommendation, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<AppRecommendation> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data: maxOrderData } = await this.supabase!
            .from('app_recommendations')
            .select('sort_order')
            .eq('user_id', userId)
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = (maxOrderData?.[0]?.sort_order || 0) + 1;

        const { data, error } = await this.supabase!
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
        if (!this.isConfigured()) return;

        const { data: app } = await this.supabase!
            .from('app_recommendations')
            .select('icon_url')
            .eq('id', id)
            .single();

        if (app?.icon_url) {
            const path = app.icon_url.split('/').pop();
            if (path) {
                await this.supabase!.storage.from(BUCKETS.APP_ICONS).remove([path]);
            }
        }

        const { error } = await this.supabase!
            .from('app_recommendations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async uploadAppIcon(file: File, userId: string): Promise<string> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const optimizedFile = await compressImage(file, { maxWidth: 200, maxHeight: 200, quality: 0.9 });
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/icon-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await this.supabase!.storage
            .from(BUCKETS.APP_ICONS)
            .upload(fileName, optimizedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = this.supabase!.storage
            .from(BUCKETS.APP_ICONS)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async updateAppOrder(items: AppRecommendation[]): Promise<void> {
        if (!this.isConfigured()) return;
        const updates = items.map((item, index) => ({
            id: item.id,
            user_id: item.userId,
            sort_order: index,
            name: item.name,
            updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase!
            .from('app_recommendations')
            .upsert(updates, { onConflict: 'id' });

        if (error) throw error;
    }

    // ==========================================
    // Tech Vault (Gear Showcase)
    // ==========================================

    async getTechVaultItems(userId: string): Promise<TechVaultItem[]> {
        if (!this.isConfigured()) return [];
        const { data, error } = await this.supabase!
            .from('tech_vault_items')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(rowToTechVaultItem);
    }

    async addTechVaultItem(userId: string, item: Omit<TechVaultItem, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<TechVaultItem> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data: maxOrderData } = await this.supabase!
            .from('tech_vault_items')
            .select('sort_order')
            .eq('user_id', userId)
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = (maxOrderData?.[0]?.sort_order || 0) + 1;

        const { data, error } = await this.supabase!
            .from('tech_vault_items')
            .insert({
                user_id: userId,
                name: item.name,
                brand: item.brand,
                category: item.category,
                image_url: item.imageUrl,
                description: item.description,
                affiliate_url: item.affiliateUrl,
                sort_order: nextOrder
            })
            .select()
            .single();

        if (error) throw error;
        return rowToTechVaultItem(data);
    }

    async deleteTechVaultItem(id: string): Promise<void> {
        if (!this.isConfigured()) return;

        const { data: item } = await this.supabase!
            .from('tech_vault_items')
            .select('image_url')
            .eq('id', id)
            .single();

        if (item?.image_url && item.image_url.includes(BUCKETS.TECH_VAULT)) {
            const urlParts = item.image_url.split(`/${BUCKETS.TECH_VAULT}/`);
            if (urlParts.length > 1) {
                await this.supabase!.storage.from(BUCKETS.TECH_VAULT).remove([urlParts[1]]);
            }
        }

        const { error } = await this.supabase!
            .from('tech_vault_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async uploadTechVaultImage(file: File, userId: string): Promise<string> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const optimizedFile = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/item-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await this.supabase!.storage
            .from(BUCKETS.TECH_VAULT)
            .upload(fileName, optimizedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = this.supabase!.storage
            .from(BUCKETS.TECH_VAULT)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    async updateTechVaultOrder(items: TechVaultItem[]): Promise<void> {
        if (!this.isConfigured()) return;
        const updates = items.map((item, index) => ({
            id: item.id,
            user_id: item.userId,
            sort_order: index,
            name: item.name,
            updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase!
            .from('tech_vault_items')
            .upsert(updates, { onConflict: 'id' });

        if (error) throw error;
    }
}
