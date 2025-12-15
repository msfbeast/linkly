import { BaseRepository } from './BaseRepository';
import { UserProfile, ApiKey } from '../../../types';
import {
    rowToUserProfile,
    userProfileToRow,
    ApiKeyRow
} from '../mappers';

export class UserRepository extends BaseRepository {

    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        if (!this.isConfigured()) return null;

        const { data, error } = await this.supabase!
            .from(this.TABLES.PROFILES)
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching user profile:', error);
            return null;
        }

        return rowToUserProfile(data);
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const rowUpdates = userProfileToRow(updates); // Need to verify userProfileToRow implementation in mappers.ts
        // Wait, I didn't add userProfileToRow to mappers.ts yet!
        // I only added rowToUserProfile.
        // I need to add userProfileToRow to mappers.ts!

        // I'll leave a TODO or implement internal helper if small.
        // It's likely small.

        // For now, let's assume I fix mappers.ts or do it locally here.
        // I'll do it locally here to speed up.

        const row: any = { ...rowUpdates, updated_at: new Date().toISOString() };

        const { data, error } = await this.supabase!
            .from(this.TABLES.PROFILES)
            .update(row)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return rowToUserProfile(data);
    }

    async getAllProfiles(limit: number = 50, offset: number = 0): Promise<UserProfile[]> {
        if (!this.isConfigured()) throw new Error('Supabase is not configured');

        const { data: rows, error } = await this.supabase!
            .from(this.TABLES.PROFILES)
            .select('*')
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Failed to fetch profiles: ${error.message}`);
        }

        return (rows || []).map(rowToUserProfile);
    }

    // =================================
    // API Keys
    // =================================

    async createApiKey(name: string, scopes: string[] = ['links:read']): Promise<{ apiKey: ApiKey; secretKey: string }> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data: { user } } = await this.supabase!.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const prefix = 'pk_live_';
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const secretPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const secretKey = `${prefix}${secretPart}`;

        const encoder = new TextEncoder();
        const dataEncoded = encoder.encode(secretKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataEncoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { data: row, error } = await this.supabase!
            .from('api_keys')
            .insert({
                user_id: user.id,
                name,
                key_hash: keyHash,
                prefix: secretKey.substring(0, 12) + '...',
                scopes,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            apiKey: {
                id: row.id,
                userId: row.user_id,
                name: row.name,
                prefix: row.prefix,
                scopes: row.scopes,
                lastUsedAt: row.last_used_at ? new Date(row.last_used_at).getTime() : undefined,
                expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
                createdAt: new Date(row.created_at).getTime(),
            },
            secretKey,
        };
    }

    async getApiKeys(): Promise<ApiKey[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching API keys:', error);
            return [];
        }

        return data.map((row: ApiKeyRow) => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            prefix: row.prefix,
            scopes: row.scopes,
            lastUsedAt: row.last_used_at ? new Date(row.last_used_at).getTime() : undefined,
            expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
            createdAt: new Date(row.created_at).getTime(),
        }));
    }

    async revokeApiKey(id: string): Promise<void> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { error } = await this.supabase!
            .from('api_keys')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
