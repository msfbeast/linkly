import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { categorizeReferrer, generateTrafficSourceData } from '../analyticsService';
import { ClickEvent, LinkData, TrafficSource } from '../../types';

/**
 * **Feature: production-analytics, Property 9: Traffic source categorization completeness**
 * **Validates: Requirements 4.2**
 * 
 * For any referrer string, the categorization function SHALL assign exactly one
 * category from {Direct, Social, Referral}.
 */

// Generator for valid ClickEvent
const clickEventArb: fc.Arbitrary<ClickEvent> = fc.record({
  timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  referrer: fc.string(),
  device: fc.constantFrom('Mobile', 'Desktop', 'Tablet', 'Other') as fc.Arbitrary<ClickEvent['device']>,
  os: fc.constantFrom('iOS', 'Android', 'Windows', 'MacOS', 'Linux', 'Other') as fc.Arbitrary<ClickEvent['os']>,
  country: fc.option(fc.string(), { nil: undefined }),
});

// Generator for LinkData with click history
const linkDataArb: fc.Arbitrary<LinkData> = fc.record({
  id: fc.uuid(),
  originalUrl: fc.webUrl(),
  shortCode: fc.string({ minLength: 1, maxLength: 10 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string(), { nil: undefined }),
  tags: fc.array(fc.string(), { maxLength: 5 }),
  createdAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  clicks: fc.integer({ min: 0, max: 1000 }),
  lastClickedAt: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }), { nil: undefined }),
  clickHistory: fc.array(clickEventArb, { minLength: 0, maxLength: 20 }),
});

const validCategories: TrafficSource[] = ['direct', 'social', 'referral'];

describe('Traffic Source Categorization Property Tests', () => {
  /**
   * Property 9: Every referrer maps to exactly one valid category
   */
  it('should assign exactly one category from {direct, social, referral} for any referrer', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (referrer) => {
          const category = categorizeReferrer(referrer);
          
          // Category must be one of the valid values
          expect(validCategories).toContain(category);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Empty referrer is categorized as direct
   */
  it('should categorize empty referrer as direct', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', 'direct', 'Direct', 'DIRECT'),
        (referrer) => {
          const category = categorizeReferrer(referrer);
          expect(category).toBe('direct');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Social media referrers are categorized as social
   */
  it('should categorize social media referrers as social', () => {
    const socialDomains = [
      'https://twitter.com/user',
      'https://t.co/abc123',
      'https://facebook.com/page',
      'https://www.instagram.com/profile',
      'https://linkedin.com/in/user',
      'https://tiktok.com/@user',
      'https://youtube.com/watch?v=123',
      'https://youtu.be/abc',
      'https://reddit.com/r/test',
      'https://pinterest.com/pin/123',
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...socialDomains),
        (referrer) => {
          const category = categorizeReferrer(referrer);
          expect(category).toBe('social');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Non-social, non-empty referrers are categorized as referral
   */
  it('should categorize non-social referrers as referral', () => {
    const referralDomains = [
      'https://google.com/search',
      'https://example.com',
      'https://blog.example.org',
      'https://news.ycombinator.com',
      'https://medium.com/article',
    ];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...referralDomains),
        (referrer) => {
          const category = categorizeReferrer(referrer);
          expect(category).toBe('referral');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: generateTrafficSourceData returns exactly 3 categories
   */
  it('should return exactly 3 traffic source categories', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const data = generateTrafficSourceData(links, 'all');
          
          expect(data.length).toBe(3);
          expect(data.map(d => d.name)).toEqual(['Direct', 'Social', 'Referral']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Sum of categorized clicks equals total clicks
   */
  it('should preserve total click count across categories', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const data = generateTrafficSourceData(links, 'all');
          const totalCategorized = data.reduce((sum, d) => sum + d.value, 0);
          const totalEvents = links.reduce((sum, link) => sum + link.clickHistory.length, 0);
          
          expect(totalCategorized).toBe(totalEvents);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: All values are non-negative
   */
  it('should produce non-negative values for all categories', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const data = generateTrafficSourceData(links, 'all');
          
          data.forEach(source => {
            expect(source.value).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
