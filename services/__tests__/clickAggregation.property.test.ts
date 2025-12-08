import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { aggregateClicksByDayOfWeek, generateClickForecastData } from '../analyticsService';
import { ClickEvent, LinkData } from '../../types';

/**
 * **Feature: production-analytics, Property 10: Click aggregation by day preserves total**
 * **Validates: Requirements 4.1**
 * 
 * For any array of ClickEvents, the sum of clicks across all days in the aggregated
 * result SHALL equal the total number of input events.
 */

// Generator for valid ClickEvent
const clickEventArb: fc.Arbitrary<ClickEvent> = fc.record({
  timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
  referrer: fc.string(),
  device: fc.constantFrom('mobile', 'desktop', 'tablet', 'unknown') as fc.Arbitrary<ClickEvent['device']>,
  os: fc.constantFrom('ios', 'android', 'windows', 'macos', 'linux', 'unknown') as fc.Arbitrary<ClickEvent['os']>,
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

describe('Click Aggregation Property Tests', () => {
  /**
   * Property 10: Sum of aggregated clicks equals total input events
   */
  it('should preserve total click count when aggregating by day of week', () => {
    fc.assert(
      fc.property(
        fc.array(clickEventArb, { minLength: 0, maxLength: 100 }),
        (events) => {
          const aggregated = aggregateClicksByDayOfWeek(events);
          const totalAggregated = Object.values(aggregated).reduce((sum, count) => sum + count, 0);

          expect(totalAggregated).toBe(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: All days of week are present in aggregation
   */
  it('should include all seven days of the week in aggregation', () => {
    fc.assert(
      fc.property(
        fc.array(clickEventArb, { minLength: 0, maxLength: 50 }),
        (events) => {
          const aggregated = aggregateClicksByDayOfWeek(events);
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

          days.forEach(day => {
            expect(aggregated).toHaveProperty(day);
            expect(typeof aggregated[day]).toBe('number');
            expect(aggregated[day]).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: generateClickForecastData preserves total across actual values
   */
  it('should preserve total clicks in forecast data actual values', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const forecastData = generateClickForecastData(links, 'all');

          // Sum of actual values should equal total click events
          const totalActual = forecastData.reduce((sum, point) => sum + point.actual, 0);
          const totalEvents = links.reduce((sum, link) => sum + link.clickHistory.length, 0);

          expect(totalActual).toBe(totalEvents);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Forecast data always has 7 days
   */
  it('should always return exactly 7 days in forecast data', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const forecastData = generateClickForecastData(links, 'all');

          expect(forecastData.length).toBe(7);

          const expectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          forecastData.forEach((point, index) => {
            expect(point.date).toBe(expectedDays[index]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Forecast values are non-negative
   */
  it('should produce non-negative forecast and actual values', () => {
    fc.assert(
      fc.property(
        fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
        (links) => {
          const forecastData = generateClickForecastData(links, 'all');

          forecastData.forEach(point => {
            expect(point.actual).toBeGreaterThanOrEqual(0);
            expect(point.forecast).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
