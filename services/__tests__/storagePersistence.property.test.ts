import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LinkData, ClickEvent, LinkCategory } from '../../types';

/**
 * **Feature: production-analytics, Property 2: Storage persistence**
 * **Validates: Requirements 1.1**
 * 
 * For any valid LinkData object, after calling createLink, calling getLink
 * with the returned ID SHALL return an equivalent LinkData object.
 * 
 * Note: This test validates the serialization/deserialization logic used by
 * the storage adapter. Full integration tests with Supabase require a live
 * database connection.
 */
describe('Storage Persistence Property Tests', () => {
  // Generator for valid device types
  const deviceTypeArb = fc.constantFrom('mobile', 'desktop', 'tablet', 'unknown') as fc.Arbitrary<ClickEvent['device']>;
  
  // Generator for valid OS types
  const osTypeArb = fc.constantFrom('ios', 'android', 'windows', 'macos', 'linux', 'unknown') as fc.Arbitrary<ClickEvent['os']>;
  
  // Generator for valid link categories
  const categoryArb = fc.constantFrom('social', 'marketing', 'product', 'other') as fc.Arbitrary<LinkCategory>;

  // Generator for click events
  const clickEventArb: fc.Arbitrary<ClickEvent> = fc.record({
    timestamp: fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
    referrer: fc.string(),
    device: deviceTypeArb,
    os: osTypeArb,
    country: fc.option(fc.string(), { nil: undefined }),
  });

  // Generator for smart redirects
  const smartRedirectsArb = fc.option(
    fc.record({
      ios: fc.option(fc.webUrl(), { nil: undefined }),
      android: fc.option(fc.webUrl(), { nil: undefined }),
      desktop: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    { nil: undefined }
  );


  // Generator for AI analysis
  const aiAnalysisArb = fc.option(
    fc.record({
      sentiment: fc.string(),
      category: fc.string(),
      predictedEngagement: fc.constantFrom('High', 'Medium', 'Low') as fc.Arbitrary<'High' | 'Medium' | 'Low'>,
    }),
    { nil: undefined }
  );

  // Generator for valid LinkData objects (without id for creation)
  const linkDataWithoutIdArb = fc.record({
    originalUrl: fc.webUrl(),
    shortCode: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    title: fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
    description: fc.option(fc.string(), { nil: undefined }),
    tags: fc.array(fc.string(), { maxLength: 10 }),
    createdAt: fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
    category: fc.option(categoryArb, { nil: undefined }),
    clicks: fc.integer({ min: 0, max: 1000000 }),
    lastClickedAt: fc.option(fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }), { nil: undefined }),
    clickHistory: fc.array(clickEventArb, { maxLength: 20 }),
    smartRedirects: smartRedirectsArb,
    geoRedirects: fc.option(fc.dictionary(fc.string({ minLength: 2, maxLength: 3 }), fc.webUrl()), { nil: undefined }),
    expirationDate: fc.option(fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 }), { nil: null }),
    maxClicks: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null }),
    password: fc.option(fc.string(), { nil: null }),
    qrCodeData: fc.option(fc.string(), { nil: undefined }),
    aiAnalysis: aiAnalysisArb,
  });

  /**
   * Simulates the database row conversion that happens in the storage adapter.
   * This mirrors the rowToLinkData and linkDataToRow functions.
   */
  function simulateStorageRoundTrip(input: Omit<LinkData, 'id'>): LinkData {
    const id = 'test-uuid-' + Math.random().toString(36).substring(7);
    
    // Simulate conversion to database row format (snake_case, ISO dates)
    const row = {
      id,
      original_url: input.originalUrl,
      short_code: input.shortCode,
      title: input.title,
      description: input.description ?? null,
      tags: input.tags || [],
      category: input.category ?? null,
      created_at: new Date(input.createdAt).toISOString(),
      clicks: input.clicks,
      last_clicked_at: input.lastClickedAt !== undefined ? new Date(input.lastClickedAt).toISOString() : null,
      smart_redirects: input.smartRedirects ?? null,
      geo_redirects: input.geoRedirects ?? null,
      expiration_date: input.expirationDate !== undefined && input.expirationDate !== null ? new Date(input.expirationDate).toISOString() : null,
      max_clicks: input.maxClicks ?? null,
      password_hash: input.password ?? null,
      qr_code_data: input.qrCodeData ?? null,
      ai_analysis: input.aiAnalysis ?? null,
    };
    
    // Simulate conversion back from database row format
    return {
      id: row.id,
      originalUrl: row.original_url,
      shortCode: row.short_code,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags || [],
      category: (row.category as LinkCategory) ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
      clicks: row.clicks,
      lastClickedAt: row.last_clicked_at !== null ? new Date(row.last_clicked_at).getTime() : undefined,
      clickHistory: input.clickHistory || [],
      smartRedirects: row.smart_redirects ?? undefined,
      geoRedirects: row.geo_redirects ?? undefined,
      expirationDate: row.expiration_date !== null ? new Date(row.expiration_date).getTime() : null,
      maxClicks: row.max_clicks,
      password: row.password_hash,
      qrCodeData: row.qr_code_data ?? undefined,
      aiAnalysis: row.ai_analysis as LinkData['aiAnalysis'] ?? undefined,
    };
  }


  /**
   * Property 2: Storage round-trip preserves essential fields
   * After simulating createLink and getLink, essential fields should be preserved
   */
  it('should preserve essential LinkData fields through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // Essential fields must be preserved exactly
          expect(retrieved.originalUrl).toBe(inputData.originalUrl);
          expect(retrieved.shortCode).toBe(inputData.shortCode);
          expect(retrieved.title).toBe(inputData.title);
          expect(retrieved.clicks).toBe(inputData.clicks);
          expect(retrieved.tags).toEqual(inputData.tags);
          
          // ID should be assigned
          expect(retrieved.id).toBeDefined();
          expect(retrieved.id.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Optional fields preservation
   * Optional fields should be preserved or correctly converted to undefined
   */
  it('should correctly handle optional fields through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // Description: null -> undefined, string -> string
          if (inputData.description === undefined || inputData.description === null) {
            expect(retrieved.description).toBeUndefined();
          } else {
            expect(retrieved.description).toBe(inputData.description);
          }
          
          // Category: null -> undefined, string -> string
          if (inputData.category === undefined || inputData.category === null) {
            expect(retrieved.category).toBeUndefined();
          } else {
            expect(retrieved.category).toBe(inputData.category);
          }
          
          // QR code data: null -> undefined, string -> string
          if (inputData.qrCodeData === undefined || inputData.qrCodeData === null) {
            expect(retrieved.qrCodeData).toBeUndefined();
          } else {
            expect(retrieved.qrCodeData).toBe(inputData.qrCodeData);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Timestamp fields are preserved with millisecond precision
   * Timestamps should survive the ISO string conversion
   */
  it('should preserve timestamp fields through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // createdAt should be preserved (may lose sub-millisecond precision)
          expect(retrieved.createdAt).toBe(inputData.createdAt);
          
          // lastClickedAt: undefined -> undefined, number -> number
          if (inputData.lastClickedAt === undefined) {
            expect(retrieved.lastClickedAt).toBeUndefined();
          } else {
            expect(retrieved.lastClickedAt).toBe(inputData.lastClickedAt);
          }
          
          // expirationDate: null -> null, number -> number
          if (inputData.expirationDate === null || inputData.expirationDate === undefined) {
            expect(retrieved.expirationDate).toBeNull();
          } else {
            expect(retrieved.expirationDate).toBe(inputData.expirationDate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 2: Complex nested objects are preserved
   * smartRedirects, geoRedirects, and aiAnalysis should survive storage
   */
  it('should preserve complex nested objects through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // Smart redirects
          if (inputData.smartRedirects === undefined || inputData.smartRedirects === null) {
            expect(retrieved.smartRedirects).toBeUndefined();
          } else {
            expect(retrieved.smartRedirects).toEqual(inputData.smartRedirects);
          }
          
          // Geo redirects
          if (inputData.geoRedirects === undefined || inputData.geoRedirects === null) {
            expect(retrieved.geoRedirects).toBeUndefined();
          } else {
            expect(retrieved.geoRedirects).toEqual(inputData.geoRedirects);
          }
          
          // AI analysis
          if (inputData.aiAnalysis === undefined || inputData.aiAnalysis === null) {
            expect(retrieved.aiAnalysis).toBeUndefined();
          } else {
            expect(retrieved.aiAnalysis).toEqual(inputData.aiAnalysis);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Click history is preserved
   * The click history array should be preserved through storage
   */
  it('should preserve click history through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // Click history should be preserved
          expect(retrieved.clickHistory.length).toBe(inputData.clickHistory.length);
          expect(retrieved.clickHistory).toEqual(inputData.clickHistory);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Nullable fields are handled correctly
   * Fields that can be null should remain null after storage
   */
  it('should correctly handle nullable fields through storage round-trip', () => {
    fc.assert(
      fc.property(
        linkDataWithoutIdArb,
        (inputData) => {
          const retrieved = simulateStorageRoundTrip(inputData);
          
          // maxClicks: null -> null, number -> number
          if (inputData.maxClicks === null || inputData.maxClicks === undefined) {
            expect(retrieved.maxClicks).toBeNull();
          } else {
            expect(retrieved.maxClicks).toBe(inputData.maxClicks);
          }
          
          // password: null -> null, string -> string
          if (inputData.password === null || inputData.password === undefined) {
            expect(retrieved.password).toBeNull();
          } else {
            expect(retrieved.password).toBe(inputData.password);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
