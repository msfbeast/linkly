import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getTopPerformingLinks, LinkData, ClickEvent } from '../types';

/**
 * **Feature: dashboard-ui-redesign, Property 2: Link Card Count Limiting**
 * *For any* array of links, the dashboard should display at most 4 link performance cards,
 * selecting the top performers by click count.
 * **Validates: Requirements 2.1**
 */
describe('Dashboard - Property Tests', () => {
  // Arbitrary for generating click events
  const clickEventArbitrary: fc.Arbitrary<ClickEvent> = fc.record({
    timestamp: fc.integer({ min: 1609459200000, max: 1735689600000 }), // 2021-2025
    referrer: fc.constantFrom('direct', 'twitter.com', 'facebook.com', 'google.com', ''),
    device: fc.constantFrom<'Mobile' | 'Desktop' | 'Tablet' | 'Other'>('Mobile', 'Desktop', 'Tablet', 'Other'),
    os: fc.constantFrom<'iOS' | 'Android' | 'Windows' | 'MacOS' | 'Linux' | 'Other'>('iOS', 'Android', 'Windows', 'MacOS', 'Linux', 'Other'),
    country: fc.option(fc.constantFrom('US', 'UK', 'DE', 'FR', 'JP'), { nil: undefined }),
  });

  // Arbitrary for generating valid LinkData objects
  const linkDataArbitrary: fc.Arbitrary<LinkData> = fc.record({
    id: fc.uuid(),
    originalUrl: fc.webUrl(),
    shortCode: fc.string({ minLength: 4, maxLength: 8 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
    title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    createdAt: fc.integer({ min: 1609459200000, max: 1735689600000 }),
    category: fc.option(fc.constantFrom<'social' | 'marketing' | 'product' | 'other'>('social', 'marketing', 'product', 'other'), { nil: undefined }),
    clicks: fc.nat({ max: 100000 }),
    lastClickedAt: fc.option(fc.integer({ min: 1609459200000, max: 1735689600000 }), { nil: undefined }),
    clickHistory: fc.array(clickEventArbitrary, { maxLength: 10 }),
  });

  // Arbitrary for generating arrays of links with varying sizes
  const linksArrayArbitrary = fc.array(linkDataArbitrary, { minLength: 0, maxLength: 20 });

  describe('Property 2: Link Card Count Limiting', () => {
    it('should return at most 4 links regardless of input size', () => {
      fc.assert(
        fc.property(
          linksArrayArbitrary,
          (links) => {
            const topLinks = getTopPerformingLinks(links, 4);
            
            // Property: result should never exceed 4 items
            expect(topLinks.length).toBeLessThanOrEqual(4);
            
            // Property: result should not exceed input size
            expect(topLinks.length).toBeLessThanOrEqual(links.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return exactly min(n, 4) links where n is input size', () => {
      fc.assert(
        fc.property(
          linksArrayArbitrary,
          (links) => {
            const topLinks = getTopPerformingLinks(links, 4);
            const expectedCount = Math.min(links.length, 4);
            
            expect(topLinks.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should select links with highest click counts', () => {
      fc.assert(
        fc.property(
          linksArrayArbitrary.filter(links => links.length > 4),
          (links) => {
            const topLinks = getTopPerformingLinks(links, 4);
            
            // Get the minimum click count in the top links
            const minTopClicks = Math.min(...topLinks.map(l => l.clicks));
            
            // Get all links NOT in the top links
            const topLinkIds = new Set(topLinks.map(l => l.id));
            const remainingLinks = links.filter(l => !topLinkIds.has(l.id));
            
            // Property: all remaining links should have clicks <= minTopClicks
            for (const remaining of remainingLinks) {
              expect(remaining.clicks).toBeLessThanOrEqual(minTopClicks);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return links sorted by click count in descending order', () => {
      fc.assert(
        fc.property(
          linksArrayArbitrary.filter(links => links.length >= 2),
          (links) => {
            const topLinks = getTopPerformingLinks(links, 4);
            
            // Property: each link should have >= clicks than the next one
            for (let i = 0; i < topLinks.length - 1; i++) {
              expect(topLinks[i].clicks).toBeGreaterThanOrEqual(topLinks[i + 1].clicks);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty input array', () => {
      const topLinks = getTopPerformingLinks([], 4);
      expect(topLinks).toEqual([]);
      expect(topLinks.length).toBe(0);
    });

    it('should handle custom limit parameter', () => {
      fc.assert(
        fc.property(
          linksArrayArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (links, limit) => {
            const topLinks = getTopPerformingLinks(links, limit);
            const expectedCount = Math.min(links.length, limit);
            
            expect(topLinks.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
