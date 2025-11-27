import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  generateClickForecastData, 
  generateTrafficSourceData, 
  generateLinkHealthData,
  DateRange 
} from '../analyticsService';
import { LinkData } from '../../types';

/**
 * **Feature: production-analytics, Property 7: Empty data produces zero values**
 * **Validates: Requirements 3.2, 4.5**
 * 
 * For any empty array of links or click events, aggregation functions SHALL return
 * data structures with zero values for all numeric fields rather than empty arrays.
 */

// Generator for DateRange
const dateRangeArb: fc.Arbitrary<DateRange> = fc.constantFrom('7d', '30d', '90d', 'all');

describe('Empty Data Handling Property Tests', () => {
  /**
   * Property 7: generateClickForecastData returns zero values for empty input
   */
  it('should return zero values for all days when no links provided', () => {
    fc.assert(
      fc.property(
        dateRangeArb,
        (dateRange) => {
          const result = generateClickForecastData([], dateRange);
          
          // Should return 7 days
          expect(result.length).toBe(7);
          
          // All values should be zero
          result.forEach(point => {
            expect(point.actual).toBe(0);
            expect(point.forecast).toBe(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: generateClickForecastData returns zero values when links have no click history
   */
  it('should return zero values when links have empty click history', () => {
    const emptyHistoryLinkArb: fc.Arbitrary<LinkData> = fc.record({
      id: fc.uuid(),
      originalUrl: fc.webUrl(),
      shortCode: fc.string({ minLength: 1, maxLength: 10 }),
      title: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.option(fc.string(), { nil: undefined }),
      tags: fc.array(fc.string(), { maxLength: 5 }),
      createdAt: fc.integer({ min: 1000000000000, max: 2000000000000 }),
      clicks: fc.constant(0),
      lastClickedAt: fc.constant(undefined),
      clickHistory: fc.constant([]), // Always empty
    });

    fc.assert(
      fc.property(
        fc.array(emptyHistoryLinkArb, { minLength: 0, maxLength: 10 }),
        dateRangeArb,
        (links, dateRange) => {
          const result = generateClickForecastData(links, dateRange);
          
          // Should return 7 days
          expect(result.length).toBe(7);
          
          // All actual values should be zero
          result.forEach(point => {
            expect(point.actual).toBe(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: generateTrafficSourceData returns zero values for empty input
   */
  it('should return zero values for all traffic sources when no links provided', () => {
    fc.assert(
      fc.property(
        dateRangeArb,
        (dateRange) => {
          const result = generateTrafficSourceData([], dateRange);
          
          // Should return 3 categories
          expect(result.length).toBe(3);
          
          // All values should be zero
          result.forEach(source => {
            expect(source.value).toBe(0);
          });
          
          // Categories should be present
          expect(result.map(s => s.name)).toEqual(['Direct', 'Social', 'Referral']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: generateLinkHealthData returns zero values for empty input
   */
  it('should return zero values for all metrics when no links provided', () => {
    const result = generateLinkHealthData([]);
    
    // Should return 5 metrics
    expect(result.length).toBe(5);
    
    // All values should be zero
    result.forEach(metric => {
      expect(metric.value).toBe(0);
    });
    
    // Metrics should be present
    expect(result.map(m => m.metric)).toEqual(['CTR', 'Engagement', 'Reach', 'Retention', 'Growth']);
  });

  /**
   * Property 7: All aggregation functions return non-empty arrays even with empty input
   */
  it('should never return empty arrays from aggregation functions', () => {
    fc.assert(
      fc.property(
        dateRangeArb,
        (dateRange) => {
          const forecastData = generateClickForecastData([], dateRange);
          const trafficData = generateTrafficSourceData([], dateRange);
          const healthData = generateLinkHealthData([]);
          
          // None should be empty
          expect(forecastData.length).toBeGreaterThan(0);
          expect(trafficData.length).toBeGreaterThan(0);
          expect(healthData.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: All numeric fields are non-negative
   */
  it('should produce non-negative values for all numeric fields', () => {
    fc.assert(
      fc.property(
        dateRangeArb,
        (dateRange) => {
          const forecastData = generateClickForecastData([], dateRange);
          const trafficData = generateTrafficSourceData([], dateRange);
          const healthData = generateLinkHealthData([]);
          
          forecastData.forEach(point => {
            expect(point.actual).toBeGreaterThanOrEqual(0);
            expect(point.forecast).toBeGreaterThanOrEqual(0);
          });
          
          trafficData.forEach(source => {
            expect(source.value).toBeGreaterThanOrEqual(0);
          });
          
          healthData.forEach(metric => {
            expect(metric.value).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
