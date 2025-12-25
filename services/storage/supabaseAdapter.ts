import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductRow, DomainRow } from './mappers';
import { AnalyticsRepository } from './repositories/AnalyticsRepository';
import { AssetRepository } from './repositories/AssetRepository';
import { BioRepository } from './repositories/BioRepository';
import { LinkRepository } from './repositories/LinkRepository';
import { MiscRepository } from './repositories/MiscRepository';
import { TeamRepository } from './repositories/TeamRepository';
import { UserRepository } from './repositories/UserRepository';
import {
  LinkData,
  BioProfile,
  Product,
  Domain,
  BioAnalyticsData,
  UserProfile,
  Team,
  TeamMember,
  TeamInvite,
  ApiKey,
  GalleryItem,
  NewsletterSubscriber,
  AppRecommendation,
  TechVaultItem,
  Tag,
  Folder,
  ClickEvent,
  Order
} from '../../types';

// Re-export specific types if needed by consumers, though ideally they should import from types directly
// Keeping for backward compatibility if consumers imported from adapter
export type { LinkData, BioProfile, Product, Domain, BioAnalyticsData, UserProfile };

// Singleton instance
let instance: SupabaseAdapter | null = null;
let supabase: SupabaseClient | null = null;

// Determine if we're on the server
const isServer = typeof window === 'undefined';

// Helper to check configuration
const isSupabaseConfigured = () => !!supabase;

import { emailService } from '../emailService';

export class SupabaseAdapter {
  private linkRepo: LinkRepository;
  private bioRepo: BioRepository;
  private assetRepo: AssetRepository;
  private analyticsRepo: AnalyticsRepository;
  private userRepo: UserRepository;
  private teamRepo: TeamRepository;
  private miscRepo: MiscRepository;

  constructor() {
    this.linkRepo = new LinkRepository();
    this.bioRepo = new BioRepository();
    this.assetRepo = new AssetRepository();
    this.analyticsRepo = new AnalyticsRepository();
    this.userRepo = new UserRepository();
    this.teamRepo = new TeamRepository();
    this.miscRepo = new MiscRepository();
  }

  static getInstance(): SupabaseAdapter {
    if (!instance) {
      instance = new SupabaseAdapter();
    }
    return instance;
  }

  async getUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Configure the Supabase client
   */
  configure(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials missing');
      return;
    }

    try {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: !isServer,
          autoRefreshToken: true,
        },
      });

      // Configure all repositories
      this.linkRepo.configure(supabase);
      this.bioRepo.configure(supabase);
      this.assetRepo.configure(supabase);
      this.analyticsRepo.configure(supabase);
      this.userRepo.configure(supabase);
      this.teamRepo.configure(supabase);
      this.miscRepo.configure(supabase);

    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
    }
  }

  // ==========================================
  // Auth (Proxy to Supabase Auth)
  // ==========================================
  get auth() {
    return supabase?.auth;
  }

  // ==========================================
  // Links
  // ==========================================

  async getLinks(teamId?: string | null, options?: { archived?: boolean; includeAnalytics?: boolean }): Promise<LinkData[]> {
    return this.linkRepo.getLinks(teamId, options);
  }

  async getPublicLinks(ids: string[]): Promise<LinkData[]> {
    return this.linkRepo.getPublicLinks(ids);
  }

  async getLink(id: string): Promise<LinkData | null> {
    return this.linkRepo.getLink(id);
  }

  async createLink(link: Omit<LinkData, 'id'> & { id?: string }): Promise<LinkData & { _isExisting?: boolean }> {
    return this.linkRepo.createLink(link);
  }

  async bulkCreateLinks(links: Omit<LinkData, 'id' | 'createdAt' | 'clicks' | 'clickHistory'>[]): Promise<LinkData[]> {
    return this.linkRepo.bulkCreateLinks(links);
  }


  async updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData> {
    return this.linkRepo.updateLink(id, updates);
  }

  async deleteLink(id: string): Promise<void> {
    return this.linkRepo.deleteLink(id);
  }

  async archiveLink(id: string): Promise<void> {
    return this.linkRepo.archiveLink(id);
  }

  async restoreLink(id: string): Promise<void> {
    return this.linkRepo.restoreLink(id);
  }

  async updateLinkOrder(ids: string[]): Promise<void> {
    return this.linkRepo.updateLinkOrder(ids);
  }

  async getLinkByCode(code: string): Promise<LinkData | null> {
    return this.linkRepo.getLinkByCode(code);
  }

  async createGuestLink(url: string, sessionId: string): Promise<LinkData> {
    return this.linkRepo.createGuestLink(url, sessionId);
  }

  async cleanupExpiredGuestLinks(): Promise<number> {
    return this.linkRepo.cleanupExpiredGuestLinks();
  }

  async getGuestLinkByToken(token: string): Promise<LinkData | null> {
    return this.linkRepo.getGuestLinkByToken(token);
  }

  async claimGuestLink(token: string, userId: string): Promise<LinkData> {
    return this.linkRepo.claimGuestLink(token, userId);
  }

  async updateGuestEmail(linkId: string, email: string): Promise<void> {
    return this.linkRepo.updateGuestEmail(linkId, email);
  }

  // Tags & Folders
  async getTags(userId: string): Promise<Tag[]> {
    return this.linkRepo.getTags(userId);
  }

  async createTag(userId: string, name: string, color: string): Promise<Tag> {
    return this.linkRepo.createTag(userId, name, color);
  }

  async deleteTag(id: string): Promise<void> {
    return this.linkRepo.deleteTag(id);
  }

  async updateTag(id: string, updates: { name?: string; color?: string }): Promise<Tag> {
    return this.linkRepo.updateTag(id, updates);
  }

  // Folders
  async getFolders(userId: string): Promise<Folder[]> {
    return this.linkRepo.getFolders(userId);
  }

  async createFolder(folder: { userId: string; name: string; parentId: string | null }): Promise<Folder> {
    return this.linkRepo.createFolder(folder);
  }

  async updateFolder(id: string, updates: { name?: string; parentId?: string | null }): Promise<Folder> {
    return this.linkRepo.updateFolder(id, updates);
  }

  async deleteFolder(id: string): Promise<void> {
    return this.linkRepo.deleteFolder(id);
  }

  async moveFolder(id: string, newParentId: string | null): Promise<void> {
    return this.linkRepo.moveFolder(id, newParentId);
  }

  async recordClick(linkId: string, event: ClickEvent): Promise<void> {
    return this.linkRepo.recordClick(linkId, event);
  }

  // ==========================================
  // Bio Profile
  // ==========================================

  async getBioProfile(userId: string): Promise<BioProfile | null> {
    return this.bioRepo.getBioProfile(userId);
  }

  async getBioProfileByHandle(handle: string): Promise<BioProfile | null> {
    return this.bioRepo.getBioProfileByHandle(handle);
  }

  async updateBioProfile(id: string, updates: Partial<BioProfile>): Promise<BioProfile | null> {
    return this.bioRepo.updateBioProfile(id, updates);
  }

  async checkHandleAvailability(handle: string): Promise<boolean> {
    return this.bioRepo.checkHandleAvailability(handle);
  }

  async createBioProfile(userId: string, handle: string, displayName?: string): Promise<BioProfile> {
    return this.bioRepo.createBioProfile(userId, handle, displayName);
  }

  async getBioProfiles(userId: string): Promise<BioProfile[]> {
    return this.bioRepo.getBioProfiles(userId);
  }

  async deleteBioProfile(id: string): Promise<void> {
    return this.bioRepo.deleteBioProfile(id);
  }

  // ==========================================
  // Products (Storefront)
  // ==========================================

  async getProducts(userId: string): Promise<Product[]> {
    return this.bioRepo.getProducts(userId);
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.bioRepo.getProductById(id);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return this.bioRepo.getProductBySlug(slug);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    return this.bioRepo.createProduct(product);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.bioRepo.updateProduct(id, updates);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.bioRepo.deleteProduct(id);
  }

  async getOrders(sellerId: string): Promise<Order[]> {
    return this.bioRepo.getOrders(sellerId);
  }

  async uploadDigitalFile(file: File, userId: string): Promise<string> {
    return this.bioRepo.uploadDigitalFile(file, userId);
  }

  // ==========================================
  // Domains
  // ==========================================

  async getDomains(userId: string): Promise<Domain[]> {
    return this.bioRepo.getDomains(userId);
  }

  async addDomain(userId: string, domain: string): Promise<Domain> {
    return this.bioRepo.addDomain(userId, domain);
  }

  async verifyDomain(domainId: string): Promise<Domain> {
    return this.bioRepo.verifyDomain(domainId);
  }

  async deleteDomain(id: string): Promise<void> {
    return this.bioRepo.deleteDomain(id);
  }

  async resolveDomain(domain: string): Promise<{ handle: string; type: 'bio' | 'store' } | null> {
    return this.bioRepo.resolveDomain(domain);
  }

  // ==========================================
  // Analytics
  // ==========================================

  async getBioAnalytics(userId: string, days = 30): Promise<BioAnalyticsData> {
    return this.analyticsRepo.getBioAnalytics(userId, days);
  }

  async getAnalyticsSummary(linkId: string, startDate: string, endDate: string) {
    return this.analyticsRepo.getAnalyticsSummary(linkId, startDate, endDate);
  }

  async getPlatformStats() {
    return this.analyticsRepo.getPlatformStats();
  }

  async runAnalyticsAggregation() {
    return this.analyticsRepo.runAggregation();
  }


  // ==========================================
  // User Profile
  // ==========================================

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userRepo.getUserProfile(userId);
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.userRepo.updateProfile(userId, updates);
  }

  async getAllProfiles(limit: number = 50, offset: number = 0): Promise<UserProfile[]> {
    return this.userRepo.getAllProfiles(limit, offset);
  }

  async updateNotificationSettings(settings: UserProfile['settingsNotifications']): Promise<void> {
    const user = await this.getUser();
    if (!user) throw new Error('User not authenticated');
    await this.updateProfile(user.id, { settingsNotifications: settings });
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    // Determine which repo handles upload. AssetRepo handles underlying upload, UserRepo handles user object?
    // Original adapter: upload to storage, then update profile, then update Auth user.
    // AssetRepo.uploadAvatar does NOT update profile properly (it returns URL).
    // So we orchestrate here.

    const url = await this.assetRepo.uploadAvatar(userId, file);

    // Update profile DB
    await this.userRepo.updateProfile(userId, { avatarUrl: url });

    // Update Supabase Auth if client available
    if (supabase) {
      await supabase.auth.updateUser({
        data: { avatar_url: url }
      });
    }

    return url;
  }

  // ==========================================
  // API Keys
  // ==========================================

  async createApiKey(name: string, scopes?: string[]): Promise<{ apiKey: ApiKey; secretKey: string }> {
    return this.userRepo.createApiKey(name, scopes);
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return this.userRepo.getApiKeys();
  }

  async revokeApiKey(id: string): Promise<void> {
    return this.userRepo.revokeApiKey(id);
  }



  // =================================
  // Team Management
  // ==========================================

  async getTeams(): Promise<Team[]> {
    return this.teamRepo.getTeams();
  }

  async createTeam(name: string, slug: string, ownerId: string): Promise<Team> {
    return this.teamRepo.createTeam(name, slug, ownerId);
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.teamRepo.getTeamMembers(teamId);
  }

  async getTeamInvites(teamId: string): Promise<TeamInvite[]> {
    return this.teamRepo.getTeamInvites(teamId);
  }

  async createInvite(teamId: string, email: string, role: string): Promise<TeamInvite> {
    const invite = await this.teamRepo.createInvite(teamId, email, role);

    // Send Invite Email
    try {
      const teams = await this.getTeams();
      const teamName = teams.find(t => t.id === teamId)?.name || 'a team';
      const inviteUrl = `${window.location.origin}/accept-invite?token=${invite.token}`;

      await emailService.sendInviteEmail(email, teamName, inviteUrl);
    } catch (e) {
      console.error('[Adapter] Failed to send invite email', e);
    }

    return invite;
  }

  async acceptInvite(token: string, userId: string): Promise<void> {
    return this.teamRepo.acceptInvite(token, userId);
  }


  // ==========================================
  // Assets (Gallery)
  // ==========================================

  async getGalleryItems(userId: string): Promise<GalleryItem[]> {
    return this.assetRepo.getGalleryItems(userId);
  }

  async addGalleryItem(userId: string, url: string, caption?: string, exifData?: any, width?: number, height?: number): Promise<GalleryItem> {
    return this.assetRepo.addGalleryItem(userId, url, caption, exifData, width, height);
  }

  async deleteGalleryItem(id: string): Promise<void> {
    return this.assetRepo.deleteGalleryItem(id);
  }

  async uploadGalleryImage(file: File, userId: string): Promise<string> {
    return this.assetRepo.uploadGalleryImage(file, userId);
  }

  async uploadOgImage(file: File, userId: string): Promise<string> {
    return this.assetRepo.uploadOgImage(file, userId);
  }




  async updateGalleryOrder(items: GalleryItem[]): Promise<void> {
    return this.assetRepo.updateGalleryOrder(items);
  }

  // ==========================================
  // Widgets (Misc)
  // ==========================================

  async addSubscriber(userId: string, email: string): Promise<void> {
    return this.miscRepo.addSubscriber(userId, email);
  }

  async getSubscribers(userId: string): Promise<NewsletterSubscriber[]> {
    return this.miscRepo.getSubscribers(userId);
  }

  async deleteSubscriber(id: string): Promise<void> {
    return this.miscRepo.deleteSubscriber(id);
  }

  async getApps(userId: string): Promise<AppRecommendation[]> {
    return this.miscRepo.getApps(userId);
  }

  async addApp(userId: string, app: Omit<AppRecommendation, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<AppRecommendation> {
    return this.miscRepo.addApp(userId, app);
  }

  async deleteApp(id: string): Promise<void> {
    return this.miscRepo.deleteApp(id);
  }

  async uploadAppIcon(file: File, userId: string): Promise<string> {
    return this.miscRepo.uploadAppIcon(file, userId);
  }

  async updateAppOrder(items: AppRecommendation[]): Promise<void> {
    return this.miscRepo.updateAppOrder(items);
  }

  async getTechVaultItems(userId: string): Promise<TechVaultItem[]> {
    return this.miscRepo.getTechVaultItems(userId);
  }

  async addTechVaultItem(userId: string, item: Omit<TechVaultItem, 'id' | 'userId' | 'createdAt' | 'sortOrder'>): Promise<TechVaultItem> {
    return this.miscRepo.addTechVaultItem(userId, item);
  }

  async deleteTechVaultItem(id: string): Promise<void> {
    return this.miscRepo.deleteTechVaultItem(id);
  }

  async uploadTechVaultImage(file: File, userId: string): Promise<string> {
    return this.miscRepo.uploadTechVaultImage(file, userId);
  }

  async updateTechVaultOrder(items: TechVaultItem[]): Promise<void> {
    return this.miscRepo.updateTechVaultOrder(items);
  }
  async exportAllData() {
    const user = await this.getUser();
    if (!user) throw new Error('User not authenticated');

    const [links, clickEvents] = await Promise.all([
      this.linkRepo.getLinks(user.id),
      this.analyticsRepo.getAllUserClickEvents(user.id)
    ]);

    return {
      links,
      clickEvents,
      exportedAt: Date.now()
    };
  }
}

export const supabaseAdapter = SupabaseAdapter.getInstance();
export { supabaseAdapter as default };
