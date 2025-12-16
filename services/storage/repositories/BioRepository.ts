import { BaseRepository } from './BaseRepository';
import { BioProfile, Product, Domain } from '../../../types';
import {
    rowToBioProfile,
    bioProfileToRow,
    rowToProduct,
    ProductRow,
    BioProfileRow,
    DomainRow,
    rowToDomain
} from '../mappers';
import { v4 as uuidv4 } from 'uuid';

export class BioRepository extends BaseRepository {

    /**
     * Get bio profile by user ID
     */
    async getBioProfile(userId: string): Promise<BioProfile | null> {
        if (!this.isConfigured()) return null;

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;
        return rowToBioProfile(data as BioProfileRow);
    }

    /**
     * Get bio profile by Handle
     */
    async getBioProfileByHandle(handle: string): Promise<BioProfile | null> {
        if (!this.isConfigured()) return null;

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .select('*')
            .ilike('handle', handle)
            .single();

        // Track view if found (fire and forget)
        // Track view if found (fire and forget)
        if (data) {
            this.supabase!.rpc('increment_bio_view', { profile_id: data.id })
                .then(async (response: any) => {
                    if (response.error) {
                        // Fallback: manual update if RPC missing (approximate)
                        // console.warn('RPC missing, falling back to manual update', response.error); 
                        const currentViews = data.views || 0;
                        await this.supabase!
                            .from(this.TABLES.BIO_PROFILES)
                            .update({ views: currentViews + 1 })
                            .eq('id', data.id);
                    }
                });
        }

        if (error || !data) return null;
        return rowToBioProfile(data as BioProfileRow);
    }

    async getBioProfiles(userId: string): Promise<BioProfile[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch bio profiles:', error);
            return [];
        }

        return (data || []).map((row: BioProfileRow) => rowToBioProfile(row));
    }

    async deleteBioProfile(id: string): Promise<void> {
        if (!this.isConfigured()) return;

        // Due to foreign key constraints, we might need to cascade or simply rely on DB cascade
        // Assuming cascade is set up in DB for now
        const { error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Update bio profile
     */
    /**
     * Update bio profile
     */
    async updateBioProfile(id: string, updates: Partial<BioProfile>): Promise<BioProfile | null> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const rowUpdates = bioProfileToRow(updates);

        // Explicitly handle updated_at
        rowUpdates.updated_at = new Date().toISOString();

        // JSONB merging for custom_theme if provided
        if (updates.customTheme) {
            // We need to fetch existing to merge? Or just overwrite?
            // Supabase update overwrites columns. custom_theme is a jsonb column.
            // The adapter usually just passed the object.
            rowUpdates.custom_theme = updates.customTheme;
        }

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .update(rowUpdates)
            .eq('id', id)
            .select();

        if (error) throw error;
        // If 0 rows updated, it might be that the user doesn't own the profile or it doesn't exist.
        // But throwing error here is better than 406.
        if (!data || data.length === 0) return null;
        return rowToBioProfile(data[0] as BioProfileRow);
    }

    async checkHandleAvailability(handle: string): Promise<boolean> {
        if (!this.isConfigured()) return false;

        if (['admin', 'support', 'help', 'api', 'dashboard'].includes(handle.toLowerCase())) {
            return false; // Reserved
        }

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .select('id')
            .ilike('handle', handle)
            .single();

        return !data; // Available if no data found
    }

    async createBioProfile(userId: string, handle: string, displayName?: string): Promise<BioProfile> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const newProfile = {
            user_id: userId,
            handle,
            display_name: displayName || handle,
            bio: '',
            avatar_url: '',
            theme: 'vibrant',
            links: [],
            views: 0
        };

        const { data, error } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .insert(newProfile)
            .select()
            .single();

        if (error) throw error;
        return rowToBioProfile(data as BioProfileRow);
    }

    // =================================
    // Products
    // =================================

    async getProducts(userId: string): Promise<Product[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
            .from(this.TABLES.PRODUCTS)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }

        return (data || []).map((row: ProductRow) => rowToProduct(row));
    }

    async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
        if (!this.isConfigured()) throw new Error('Supabase is not configured');

        const id = uuidv4();
        const now = new Date().toISOString();

        const row: ProductRow = {
            id,
            user_id: product.userId,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            image_url: product.imageUrl ?? null,
            link_id: product.linkId ?? null,
            short_code: null,
            original_url: null,
            category: null,
            created_at: now,
            slug: product.slug ?? null,
        };

        const { data, error } = await this.supabase!
            .from(this.TABLES.PRODUCTS)
            .insert(row)
            .select()
            .single();

        if (error) throw error;
        return rowToProduct(data as ProductRow);
    }

    // =================================
    // Custom Domains
    // =================================

    async getDomains(userId: string): Promise<Domain[]> {
        if (!this.isConfigured()) return [];

        // Check if table exists (it's new)
        // We assume it exists for now based on Types
        const { data, error } = await this.supabase!
            .from('domains') // using literal as it might not be in TABLES yet? Check base repo.
            .select('*')
            .eq('user_id', userId);

        if (error) return [];
        return (data || []).map((row: DomainRow) => rowToDomain(row));
    }

    async addDomain(userId: string, domain: string): Promise<Domain> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await this.supabase!
            .from('domains')
            .insert({
                user_id: userId,
                domain: domain.toLowerCase(),
                status: 'pending',
                verification_token: uuidv4(),
                target_type: 'bio'
            })
            .select()
            .single();

        if (error) throw error;
        return rowToDomain(data as DomainRow);
    }

    async verifyDomain(domainId: string): Promise<Domain> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        // Fetch domain details first
        const { data: domainData } = await this.supabase!
            .from('domains')
            .select('domain')
            .eq('id', domainId)
            .single();

        if (!domainData) throw new Error('Domain not found');

        // Perform DNS check via Google DoH (Client-side safe)
        // We expect a CNAME to 'custom.linkly.ai' (or app domain)
        const EXPECTED_CNAME = 'custom.linkly.ai';
        let isVerified = false;

        try {
            const response = await fetch(`https://dns.google/resolve?name=${domainData.domain}&type=CNAME`);
            const dnsData = await response.json();

            if (dnsData.Answer) {
                const cnameRecord = dnsData.Answer.find((r: any) => r.type === 5); // Type 5 is CNAME
                if (cnameRecord && cnameRecord.data.endsWith(EXPECTED_CNAME + '.')) {
                    isVerified = true;
                }
            } else {
                // Fallback or additional check for TXT record linkly-verification=...
            }
        } catch (e) {
            console.error('DNS Check failed', e);
            throw new Error('DNS verification failed due to network error');
        }

        if (!isVerified) {
            throw new Error(`Verification failed. CNAME for ${domainData.domain} does not point to ${EXPECTED_CNAME}`);
        }

        const { data, error } = await this.supabase!
            .from('domains')
            .update({
                status: 'active',
                verified_at: new Date().toISOString()
            })
            .eq('id', domainId)
            .select()
            .single();

        if (error) throw error;
        return rowToDomain(data as DomainRow);
    }

    async deleteDomain(id: string): Promise<void> {
        if (!this.isConfigured()) return;
        await this.supabase!.from('domains').delete().eq('id', id);
    }

    async resolveDomain(domain: string): Promise<{ handle: string; type: 'bio' | 'store' } | null> {
        if (!this.isConfigured()) return null;

        const { data: domainData, error } = await this.supabase!
            .from('domains')
            .select('user_id, target_type')
            .eq('domain', domain.toLowerCase())
            .eq('status', 'active')
            .single();

        if (error || !domainData) return null;

        // Provide logic for different target types
        if (domainData.target_type === 'store') {
            // For now, assume store uses userId or check specific store table
            // But usually we need a handle or slug.
            // Let's assume store also maps to the main bio profile handle for now, 
            // or we might need a separate store handle.
            // For MVP, we'll fetch the bio handle.
        }

        // Fetch Bio Profile Handle
        const { data: profile } = await this.supabase!
            .from(this.TABLES.BIO_PROFILES)
            .select('handle')
            .eq('user_id', domainData.user_id)
            .single();

        if (!profile) return null;

        return {
            handle: profile.handle,
            type: (domainData.target_type as 'bio' | 'store') || 'bio'
        };
    }
}
