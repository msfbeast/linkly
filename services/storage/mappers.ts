// services/storage/mappers.ts
import {
    LinkData,
    GalleryItem,
    NewsletterSubscriber,
    AppRecommendation,
    TechVaultItem,
    Tag,
    Folder,
    ClickEvent,
    BioProfile,
    Domain,
    Product,
    UserProfile,
    Order
} from '../../types';

export interface NewsletterSubscriberRow {
    id: string;
    user_id: string;
    email: string;
    created_at: string;
}

export interface ApiKeyRow {
    id: string;
    user_id: string;
    name: string;
    key_hash: string;
    prefix: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
}

export interface ProductRow {
    id: string;
    user_id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url: string | null;
    link_id: string | null;
    short_code: string | null;
    original_url: string | null;
    category: string | null;
    slug: string | null;
    created_at: string;
    // Digital Fields
    type: string | null;
    file_url: string | null;
    file_name: string | null;
    sales_count: number | null;
    download_limit: number | null;
}

export interface OrderRow {
    id: string;
    seller_id: string;
    product_id: string;
    customer_email: string | null;
    customer_name: string | null;
    amount: number;
    currency: string;
    status: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    created_at: string;
}

export interface BioProfileRow {
    id: string;
    user_id: string;
    handle: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    theme: string;
    links: string[];
    views: number;
    created_at: string;
    updated_at: string;
    custom_theme?: any;
}

export interface DomainRow {
    id: string;
    user_id: string;
    domain: string;
    status: string;
    verification_token: string;
    target_type: string;
    created_at: string;
    verified_at: string | null;
}

export interface ClickEventRow {
    id: string;
    link_id: string;
    timestamp: string;
    referrer: string;
    device: string;
    os: string;
    browser?: string;
    country: string;
    country_code?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    isp?: string;
    timezone?: string;
    browser_version?: string;
    os_version?: string;
    screen_width?: number;
    screen_height?: number;
    language?: string;
    visitor_id?: string;
    raw_user_agent: string | null;
    ip_hash: string | null;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    trigger_source?: 'link' | 'qr' | string;
    destination_url?: string;
    device_model?: string;
}

export interface TagRow {
    id: string;
    user_id: string;
    name: string;
    color: string;
    created_at?: string;
}

export interface FolderRow {
    id: string;
    user_id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
}

export interface LinkRow {
    id: string;
    original_url: string;
    short_code: string;
    title: string;
    description: string | null;
    tags: string[];
    category: string | null;
    created_at: string;
    clicks: number;
    last_clicked_at: string | null;
    smart_redirects: { ios?: string; android?: string; desktop?: string } | null;
    geo_redirects?: Record<string, string>;
    start_date?: number | null;
    expiration_date?: number | null;
    max_clicks: number | null;
    password_hash: string | null;
    qr_code_data: string | null;
    ai_analysis: Record<string, unknown> | null;
    user_id: string | null;
    team_id?: string | null;
    folder_id: string | null;
    domain?: string | null;
    is_guest?: boolean;
    claim_token?: string | null;
    expires_at?: string | null;
    type?: string;
    layout_config?: { w: number; h: number };
    metadata?: Record<string, any>;
    ab_test_config: { variants: { id: string; url: string; weight: number }[]; enabled: boolean } | null;
    is_archived?: boolean;
}

export interface GalleryItemRow {
    id: string;
    user_id: string;
    url: string;
    caption: string | null;
    exif_data: any;
    width: number | null;
    height: number | null;
    sort_order: number;
    created_at: string;
}

// Functions

export function rowToBioProfile(row: BioProfileRow): BioProfile {
    return {
        id: row.id,
        userId: row.user_id,
        handle: row.handle,
        displayName: row.display_name,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        theme: row.theme as BioProfile['theme'],
        links: row.links || [],
        views: row.views,
        customTheme: row.custom_theme,
        isPublished: true,
    };
}

export function bioProfileToRow(profile: Partial<BioProfile>, userId?: string): Partial<BioProfileRow> {
    const row: Partial<BioProfileRow> = {};
    if (profile.handle !== undefined) row.handle = profile.handle;
    if (profile.displayName !== undefined) row.display_name = profile.displayName;
    if (profile.bio !== undefined) row.bio = profile.bio;
    if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
    if (profile.theme !== undefined) row.theme = profile.theme;
    if (profile.links !== undefined) row.links = profile.links;
    if (profile.views !== undefined) row.views = profile.views;
    if (profile.customTheme !== undefined) row.custom_theme = profile.customTheme;
    if (userId) row.user_id = userId;
    return row;
}

export function userProfileToRow(profile: Partial<UserProfile>): any {
    const row: any = {};
    if (profile.username !== undefined) row.username = profile.username;
    if (profile.fullName !== undefined) row.full_name = profile.fullName;
    if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
    if (profile.website !== undefined) row.website = profile.website;
    if (profile.settingsNotifications !== undefined) row.settings_notifications = profile.settingsNotifications;
    if (profile.flipkartAffiliateId !== undefined) row.flipkart_affiliate_id = profile.flipkartAffiliateId;
    if (profile.amazonAssociateTag !== undefined) row.amazon_associate_tag = profile.amazonAssociateTag;
    if (profile.storefrontTheme !== undefined) row.storefront_theme = profile.storefrontTheme;
    if (profile.storeName !== undefined) row.store_name = profile.storeName;
    if (profile.storeLogoUrl !== undefined) row.store_logo_url = profile.storeLogoUrl;
    if (profile.storeBannerUrl !== undefined) row.store_banner_url = profile.storeBannerUrl;
    if (profile.upiId !== undefined) row.upi_id = profile.upiId;
    if (profile.onboardingCompleted !== undefined) row.onboarding_completed = profile.onboardingCompleted;
    if (profile.onboardingStep !== undefined) row.onboarding_step = profile.onboardingStep;
    if (profile.onboardingSkipped !== undefined) row.onboarding_skipped = profile.onboardingSkipped;
    if (profile.onboardingStartedAt !== undefined) row.onboarding_started_at = profile.onboardingStartedAt;
    if (profile.role !== undefined) row.role = profile.role;
    // Subscription Fields
    if (profile.subscription_tier !== undefined) row.subscription_tier = profile.subscription_tier;
    if (profile.subscription_status !== undefined) row.subscription_status = profile.subscription_status;
    if (profile.trial_ends_at !== undefined) row.trial_ends_at = profile.trial_ends_at;
    if (profile.razorpay_customer_id !== undefined) row.razorpay_customer_id = profile.razorpay_customer_id;
    if (profile.razorpay_subscription_id !== undefined) row.razorpay_subscription_id = profile.razorpay_subscription_id;
    return row;
}

export function rowToUserProfile(row: any): UserProfile {
    return {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        avatarUrl: row.avatar_url,
        website: row.website,
        updatedAt: row.updated_at,
        settingsNotifications: row.settings_notifications || {
            email: true,
            milestones: true,
            reports: true,
            security: true
        },
        flipkartAffiliateId: row.flipkart_affiliate_id,
        amazonAssociateTag: row.amazon_associate_tag,
        storefrontTheme: row.storefront_theme,
        storeName: row.store_name,
        storeLogoUrl: row.store_logo_url,
        storeBannerUrl: row.store_banner_url,
        upiId: row.upi_id,
        onboardingCompleted: row.onboarding_completed,
        onboardingStep: row.onboarding_step,
        onboardingSkipped: row.onboarding_skipped,
        onboardingStartedAt: row.onboarding_started_at,
        role: row.role,
        // Subscription Fields
        subscription_tier: row.subscription_tier,
        subscription_status: row.subscription_status,
        trial_ends_at: row.trial_ends_at,
        razorpay_customer_id: row.razorpay_customer_id,
        razorpay_subscription_id: row.razorpay_subscription_id,
    };
}

export function rowToNewsletterSubscriber(row: NewsletterSubscriberRow): NewsletterSubscriber {
    return {
        id: row.id,
        userId: row.user_id,
        email: row.email,
        createdAt: new Date(row.created_at).getTime()
    };
}

export function rowToAppRecommendation(row: any): AppRecommendation {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        iconUrl: row.icon_url,
        developer: row.developer,
        category: row.category,
        description: row.description,
        linkUrl: row.link_url,
        isPaid: row.is_paid,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at).getTime()
    };
}

export function rowToTechVaultItem(row: any): TechVaultItem {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        imageUrl: row.image_url,
        description: row.description,
        affiliateUrl: row.affiliate_url,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at).getTime()
    };
}

export function rowToTag(row: TagRow): Tag {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        color: row.color,
    };
}

export function rowToFolder(row: FolderRow): Folder {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        parentId: row.parent_id,
        createdAt: new Date(row.created_at).getTime(),
    };
}

export function rowToClickEvent(row: ClickEventRow): ClickEvent {
    return {
        timestamp: new Date(row.timestamp).getTime(),
        referrer: row.referrer,
        device: row.device as ClickEvent['device'],
        os: row.os as ClickEvent['os'],
        country: row.country,
        countryCode: row.country_code,
        region: row.region,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        isp: row.isp,
        timezone: row.timezone,
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        utm_campaign: row.utm_campaign,
        utm_term: row.utm_term,
        utm_content: row.utm_content,
        trigger_source: row.trigger_source,
        browserVersion: row.browser_version,
        osVersion: row.os_version,
        screenWidth: row.screen_width,
        screenHeight: row.screen_height,
        language: row.language,
        visitorId: row.visitor_id,
        browser: row.browser,
        destinationUrl: row.destination_url,
        deviceModel: row.device_model,
    };
}

export function rowToLinkData(row: LinkRow, clickHistory: ClickEvent[] = []): LinkData {
    return {
        id: row.id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        title: row.title,
        description: row.description ?? undefined,
        tags: row.tags || [],
        category: (row.category as LinkData['category']) ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
        clicks: row.clicks,
        lastClickedAt: row.last_clicked_at ? new Date(row.last_clicked_at).getTime() : undefined,
        clickHistory,
        smartRedirects: row.smart_redirects as LinkData['smartRedirects'] ?? undefined,
        geoRedirects: row.geo_redirects ?? undefined,
        startDate: row.start_date ?? null,
        expirationDate: row.expiration_date ?? null,
        maxClicks: row.max_clicks,
        password: row.password_hash,
        qrCodeData: row.qr_code_data ?? undefined,
        aiAnalysis: row.ai_analysis as LinkData['aiAnalysis'] ?? undefined,
        folderId: row.folder_id ?? undefined,
        teamId: row.team_id ?? undefined,
        domain: row.domain ?? undefined,
        type: (row.type as LinkData['type']) ?? 'link',
        layoutConfig: row.layout_config ?? { w: 1, h: 1 },
        metadata: row.metadata ?? {},
        abTestConfig: row.ab_test_config as LinkData['abTestConfig'] ?? undefined,
        isGuest: !!row.is_guest,
        claimToken: row.claim_token ?? undefined,
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
        isArchived: !!row.is_archived
    };
}

export function rowToProduct(row: ProductRow): Product {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description,
        price: row.price,
        currency: row.currency,
        imageUrl: row.image_url ?? undefined,
        linkId: row.link_id ?? undefined,
        shortCode: row.short_code ?? undefined,
        originalUrl: row.original_url ?? undefined,
        category: row.category ?? undefined,
        slug: row.slug ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
        // Digital Fields
        type: (row.type as Product['type']) ?? 'physical',
        fileUrl: row.file_url ?? undefined,
        fileName: row.file_name ?? undefined,
        salesCount: row.sales_count ?? 0,
        downloadLimit: row.download_limit ?? undefined,
    };
}

export function rowToOrder(row: OrderRow): Order {
    return {
        id: row.id,
        sellerId: row.seller_id,
        productId: row.product_id,
        customerEmail: row.customer_email || undefined,
        customerName: row.customer_name || undefined,
        amount: row.amount,
        currency: row.currency,
        status: row.status as Order['status'],
        razorpayOrderId: row.razorpay_order_id || undefined,
        razorpayPaymentId: row.razorpay_payment_id || undefined,
        createdAt: new Date(row.created_at).getTime()
    };
}

export function rowToDomain(row: DomainRow): Domain {
    return {
        id: row.id,
        userId: row.user_id,
        domain: row.domain,
        status: row.status as Domain['status'],
        verificationToken: row.verification_token,
        targetType: (row.target_type as Domain['targetType']) || 'bio',
        createdAt: new Date(row.created_at).getTime(),
        verifiedAt: row.verified_at ? new Date(row.verified_at).getTime() : undefined,
    };
}

export function hashIP(ip: string): string {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

export function rowToGalleryItem(row: GalleryItemRow): GalleryItem {
    return {
        id: row.id,
        userId: row.user_id,
        url: row.url,
        caption: row.caption || undefined,
        exifData: row.exif_data || undefined,
        width: row.width || undefined,
        height: row.height || undefined,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at).getTime(),
    };
}

export function linkDataToRow(link: Omit<LinkData, 'id'> & { id?: string }, userId?: string | null): Partial<LinkRow> {
    return {
        id: link.id,
        original_url: link.originalUrl,
        short_code: link.shortCode,
        title: link.title,
        description: link.description ?? null,
        tags: link.tags,
        category: link.category ?? null,
        created_at: new Date(link.createdAt).toISOString(),
        clicks: link.clicks,
        last_clicked_at: link.lastClickedAt !== undefined ? new Date(link.lastClickedAt).toISOString() : null,
        smart_redirects: link.smartRedirects ?? null,
        geo_redirects: link.geoRedirects ?? null,
        start_date: link.startDate ?? null,
        expiration_date: link.expirationDate ?? null,
        max_clicks: link.maxClicks ?? null,
        password_hash: link.password ?? null,
        qr_code_data: link.qrCodeData ?? null,
        ai_analysis: link.aiAnalysis ?? null,
        user_id: userId ?? null,
        team_id: link.teamId ?? null,
        folder_id: link.folderId ?? null,
        domain: link.domain || null,
        ab_test_config: link.abTestConfig ?? null,
        type: link.type ?? 'link',
        layout_config: link.layoutConfig ?? { w: 1, h: 1 },
        metadata: link.metadata ?? {},
        is_guest: !!link.isGuest,
        claim_token: link.claimToken ?? null,
        expires_at: link.expiresAt ? new Date(link.expiresAt).toISOString() : null,
        is_archived: !!link.isArchived
    };
}
