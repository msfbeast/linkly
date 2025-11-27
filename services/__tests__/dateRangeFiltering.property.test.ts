import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByDateRange, DateRange, dateRangeToMs } from '../analyticsService';
import { ClickEvent } from '../../types';

/**
 * **Feature: production-analytics, Property 8: Date range filtering correctness**
 * **Validates: Requirements 4.4**
 * 
 * For any array of ClickEvents and a date range, filterByDateRange SHALL return only
 * events where timestamp falls within the specified range, and the result SHALL be
 * a subset of the input.
 */

// Generator for valid ClickEvent
const clickEventArb = (timestampArb: fc.Arbitrary<number>): fc.Arbitrary<ClickEvent> =>
  fc.record({
    timestamp: timestampArb,
    referrer: fc.string(),
    device: fc.constantFrom('Mobile', 'Desktop', 'Tablet', 'Other') as fc.Arbitrary<ClickEvent['device']>,
    os: fc.constantFrom('iOS', 'Android', 'Windows', 'MacOS', 'Linux', 'Other') as fc.Arbitrary<ClickEvent['os']>,
    country: fc.option(fc.string(), { nil: undefined }),
  });

// Generator for DateRange
const dateRangeArb: fc.Arbitrary<DateRange> = fc.constantFrom('7d', '30d', '90d', 'all');

describe('Date Range Filtering Property Tests', () => {
  /**
   * Property 8: All returned events fall within the specified date range
   */
  it('should return only events within the specified date range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }), // referenceTime
        dateRangeArb,
        fc.array(clickEventArb(fc.integer({ min: 0, max: 2500000000000 })), { minLength: 0, maxLength: 50 }),
        (referenceTime, range, events) => {
          const filtered = filterByDateRange(events, range, referenceTime);
          const rangeMs = dateRangeToMs(range);
          
          if (rangeMs === null) {
            // 'all' range should return all events
            expect(filtered.length).toBe(events.length);
          } else {
            const startTime = referenceTime - rangeMs;
            
            // All filtered events should be within range
            filtered.forEach(event => {
              expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
              expect(event.timestamp).toBeLessThanOrEqual(referenceTime);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Result is always a subset of input
   */
  it('should return a subset of the input events', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        dateRangeArb,
        fc.array(clickEventArb(fc.integer({ min: 0, max: 2500000000000 })), { minLength: 0, maxLength: 50 }),
        (referenceTime, range, events) => {
          const filtered = filterByDateRange(events, range, referenceTime);
          
          // Result length should be <= input length
          expect(filtered.length).toBeLessThanOrEqual(events.length);
          
          // Every filtered event should exist in original array
          filtered.forEach(filteredEvent => {
            const exists = events.some(e => 
              e.timestamp === filteredEvent.timestamp &&
              e.referrer === filteredEvent.referrer &&
              e.device === filteredEvent.device &&
              e.os === filteredEvent.os
            );
            expect(exists).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Events outside range are excluded
   */
  it('should exclude events outside the date range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        fc.constantFrom('7d', '30d', '90d') as fc.Arbitrary<DateRange>, // Exclude 'all' for this test
        fc.array(clickEventArb(fc.integer({ min: 0, max: 2500000000000 })), { minLength: 0, maxLength: 50 }),
        (referenceTime, range, events) => {
          const filtered = filterByDateRange(events, range, referenceTime);
          const rangeMs = dateRangeToMs(range)!;
          const startTime = referenceTime - rangeMs;
          
          // Count events that should be excluded
          const eventsOutsideRange = events.filter(
            e => e.timestamp < startTime || e.timestamp > referenceTime
          );
          
          // None of the excluded events should be in the result
          eventsOutsideRange.forEach(excludedEvent => {
            const inFiltered = filtered.some(f => 
              f.timestamp === excludedEvent.timestamp &&
              f.referrer === excludedEvent.referrer
            );
            expect(inFiltered).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: 'all' range returns all events unchanged
   */
  it('should return all events when range is "all"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        fc.array(clickEventArb(fc.integer({ min: 0, max: 2500000000000 })), { minLength: 0, maxLength: 50 }),
        (referenceTime, events) => {
          const filtered = filterByDateRange(events, 'all', referenceTime);
          
          expect(filtered.length).toBe(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Filtering is idempotent
   */
  it('should be idempotent - filtering twice gives same result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000000000, max: 2000000000000 }),
        dateRangeArb,
        fc.array(clickEventArb(fc.integer({ min: 0, max: 2500000000000 })), { minLength: 0, maxLength: 50 }),
        (referenceTime, range, events) => {
          const filtered1 = filterByDateRange(events, range, referenceTime);
          const filtered2 = filterByDateRange(filtered1, range, referenceTime);
          
          expect(filtered2.length).toBe(filtered1.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
