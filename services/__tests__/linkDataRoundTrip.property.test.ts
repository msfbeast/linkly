import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LinkData, ClickEvent, LinkCategory } from '../../types';

/**
 * **Feature: production-analytics, Property 1: Link data round-trip consistency**
 * **Validates: Requirements 1.5, 1.6**
 * 
 * For any valid LinkData object, serializing to JSON and then parsing back
 * SHALL produce an equivalent LinkData object with all fields preserved.
 */
describe('LinkData Round-Trip Property Tests', () => {
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

  // Generator for valid LinkData objects
  const linkDataArb: fc.Arbitrary<LinkData> = fc.record({
    id: fc.uuid(),
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
   * Property 1: JSON round-trip preserves all fields
   * Serializing to JSON and parsing back should produce an equivalent object
   */
  it('should preserve all LinkData fields through JSON serialization round-trip', () => {
    fc.assert(
      fc.property(
        linkDataArb,
        (linkData) => {
          // Serialize to JSON
          const jsonString = JSON.stringify(linkData);
          
          // Parse back
          const parsed = JSON.parse(jsonString) as LinkData;
          
          // Verify all fields are preserved
          expect(parsed.id).toBe(linkData.id);
          expect(parsed.originalUrl).toBe(linkData.originalUrl);
          expect(parsed.shortCode).toBe(linkData.shortCode);
          expect(parsed.title).toBe(linkData.title);
          expect(parsed.description).toBe(linkData.description);
          expect(parsed.tags).toEqual(linkData.tags);
          expect(parsed.createdAt).toBe(linkData.createdAt);
          expect(parsed.category).toBe(linkData.category);
          expect(parsed.clicks).toBe(linkData.clicks);
          expect(parsed.lastClickedAt).toBe(linkData.lastClickedAt);
          expect(parsed.clickHistory).toEqual(linkData.clickHistory);
          expect(parsed.smartRedirects).toEqual(linkData.smartRedirects);
          expect(parsed.geoRedirects).toEqual(linkData.geoRedirects);
          expect(parsed.expirationDate).toBe(linkData.expirationDate);
          expect(parsed.maxClicks).toBe(linkData.maxClicks);
          expect(parsed.password).toBe(linkData.password);
          expect(parsed.qrCodeData).toBe(linkData.qrCodeData);
          expect(parsed.aiAnalysis).toEqual(linkData.aiAnalysis);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 1: Deep equality after round-trip
   * The entire object should be deeply equal after round-trip
   */
  it('should produce deeply equal LinkData after JSON round-trip', () => {
    fc.assert(
      fc.property(
        linkDataArb,
        (linkData) => {
          const jsonString = JSON.stringify(linkData);
          const parsed = JSON.parse(jsonString) as LinkData;
          
          // Deep equality check
          expect(parsed).toEqual(linkData);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Click history preservation
   * All click events in history should be preserved exactly
   */
  it('should preserve click history array through round-trip', () => {
    fc.assert(
      fc.property(
        linkDataArb,
        (linkData) => {
          const jsonString = JSON.stringify(linkData);
          const parsed = JSON.parse(jsonString) as LinkData;
          
          // Verify click history length
          expect(parsed.clickHistory.length).toBe(linkData.clickHistory.length);
          
          // Verify each click event
          linkData.clickHistory.forEach((event, index) => {
            expect(parsed.clickHistory[index].timestamp).toBe(event.timestamp);
            expect(parsed.clickHistory[index].referrer).toBe(event.referrer);
            expect(parsed.clickHistory[index].device).toBe(event.device);
            expect(parsed.clickHistory[index].os).toBe(event.os);
            expect(parsed.clickHistory[index].country).toBe(event.country);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Nested objects preservation
   * Complex nested objects like smartRedirects and geoRedirects should be preserved
   */
  it('should preserve nested objects through round-trip', () => {
    fc.assert(
      fc.property(
        linkDataArb,
        (linkData) => {
          const jsonString = JSON.stringify(linkData);
          const parsed = JSON.parse(jsonString) as LinkData;
          
          // Smart redirects
          if (linkData.smartRedirects) {
            expect(parsed.smartRedirects).toBeDefined();
            expect(parsed.smartRedirects?.ios).toBe(linkData.smartRedirects.ios);
            expect(parsed.smartRedirects?.android).toBe(linkData.smartRedirects.android);
            expect(parsed.smartRedirects?.desktop).toBe(linkData.smartRedirects.desktop);
          } else {
            expect(parsed.smartRedirects).toBeUndefined();
          }
          
          // Geo redirects
          if (linkData.geoRedirects) {
            expect(parsed.geoRedirects).toBeDefined();
            Object.keys(linkData.geoRedirects).forEach(key => {
              expect(parsed.geoRedirects?.[key]).toBe(linkData.geoRedirects![key]);
            });
          } else {
            expect(parsed.geoRedirects).toBeUndefined();
          }
          
          // AI analysis
          if (linkData.aiAnalysis) {
            expect(parsed.aiAnalysis).toBeDefined();
            expect(parsed.aiAnalysis?.sentiment).toBe(linkData.aiAnalysis.sentiment);
            expect(parsed.aiAnalysis?.category).toBe(linkData.aiAnalysis.category);
            expect(parsed.aiAnalysis?.predictedEngagement).toBe(linkData.aiAnalysis.predictedEngagement);
          } else {
            expect(parsed.aiAnalysis).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Idempotent serialization
   * Multiple round-trips should produce the same result
   */
  it('should be idempotent - multiple round-trips produce same result', () => {
    fc.assert(
      fc.property(
        linkDataArb,
        (linkData) => {
          // First round-trip
          const json1 = JSON.stringify(linkData);
          const parsed1 = JSON.parse(json1) as LinkData;
          
          // Second round-trip
          const json2 = JSON.stringify(parsed1);
          const parsed2 = JSON.parse(json2) as LinkData;
          
          // Third round-trip
          const json3 = JSON.stringify(parsed2);
          const parsed3 = JSON.parse(json3) as LinkData;
          
          // All should be equal
          expect(parsed1).toEqual(parsed2);
          expect(parsed2).toEqual(parsed3);
          expect(json1).toBe(json2);
          expect(json2).toBe(json3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
