import { BaseRepository } from './BaseRepository';
import { compressImage } from '../../../utils/imageUtils';
import { v4 as uuidv4 } from 'uuid';
import { GalleryItem } from '../../../types';
import { rowToGalleryItem, GalleryItemRow } from '../mappers';
import { BUCKETS } from '../constants';

export class AssetRepository extends BaseRepository {

    async uploadAvatar(userId: string, file: File): Promise<string> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const optimizedFile = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await this.supabase!.storage
            .from(BUCKETS.AVATARS)
            .upload(filePath, optimizedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = this.supabase!.storage
            .from(BUCKETS.AVATARS)
            .getPublicUrl(fileName);

        return publicUrl;
    }

    async uploadGalleryImage(file: File, userId: string): Promise<string> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const optimizedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await this.supabase!.storage
            .from(BUCKETS.GALLERY)
            .upload(fileName, optimizedFile, { upsert: true });

        if (uploadError) {
            console.error('Error uploading gallery image:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = this.supabase!.storage
            .from(BUCKETS.GALLERY)
            .getPublicUrl(fileName);

        return publicUrl;
    }

    async uploadOgImage(file: File, userId: string): Promise<string> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // OG images recommended 1200x630
        const optimizedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 630, quality: 0.9 });
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/og-${Date.now()}.${fileExt}`;

        // Reuse gallery bucket or generic bucket. Constants has BUCKETS.GALLERY. 
        // Let's use BUCKETS.GALLERY for now as it's safe.
        const { error: uploadError } = await this.supabase!.storage
            .from(BUCKETS.GALLERY)
            .upload(fileName, optimizedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = this.supabase!.storage
            .from(BUCKETS.GALLERY)
            .getPublicUrl(fileName);

        return publicUrl;
    }

    async getGalleryItems(userId: string): Promise<GalleryItem[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
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
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const newItem = {
            user_id: userId,
            url,
            caption,
            exif_data: exifData,
            width,
            height,
            sort_order: 0
        };

        const { data, error } = await this.supabase!
            .from('gallery_items')
            .insert(newItem)
            .select()
            .single();

        if (error) {
            console.error('Error adding gallery item:', error);
            throw error;
        }

        return rowToGalleryItem(data as GalleryItemRow);
    }

    async deleteGalleryItem(id: string): Promise<void> {
        if (!this.isConfigured()) return;

        // First get the item to find the file URL
        const { data: item } = await this.supabase!
            .from('gallery_items')
            .select('url')
            .eq('id', id)
            .single();

        if (item?.url) {
            const urlObj = new URL(item.url);
            const pathParts = urlObj.pathname.split('/gallery-images/');
            if (pathParts.length > 1) {
                const storagePath = pathParts[1];
                await this.supabase!.storage
                    .from(BUCKETS.GALLERY)
                    .remove([storagePath]);
            }
        }

        const { error } = await this.supabase!
            .from('gallery_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting gallery item:', error);
            throw error;
        }
    }

    async updateGalleryOrder(items: GalleryItem[]): Promise<void> {
        if (!this.isConfigured()) return;

        const updates = items.map((item, index) => ({
            id: item.id,
            sort_order: index,
            user_id: item.userId,
            updated_at: new Date().toISOString()
        }));

        const { error } = await this.supabase!
            .from('gallery_items')
            .upsert(updates);

        if (error) {
            console.error('Error updating gallery order:', error);
            throw error;
        }
    }
}
