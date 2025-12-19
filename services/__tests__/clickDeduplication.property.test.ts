import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { deduplicateEvents, ClickEventWithLinkId } from '../clickTrackingService';
import { ClickEvent } from '../../types';

/**
 * **Feature: production-analytics, Property 13: Deduplication by timestamp and linkId**
 * **Validates: Requirements 6.4**
 * 
 * For any array of ClickEvents containing duplicates (same linkId and timestamp),
 * deduplication SHALL return an array with no duplicates, and the length SHALL be
 * less than or equal to the input length.
 */
describe('Click Deduplication Property Tests', () => {
  // Valid device types
  const deviceTypes: ClickEvent['device'][] = ['mobile', 'desktop', 'tablet', 'unknown'];
  
  // Valid OS types
  const osTypes: ClickEvent['os'][] = ['ios', 'android', 'windows', 'macos', 'linux', 'unknown'];

  // Generator for valid linkIds
  const linkIdArb = fc.uuid();

  // Generator for valid timestamps
  const timestampArb = fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 });

  // Generator for a single ClickEventWithLinkId
  const clickEventWithLinkIdArb = fc.record({
    linkId: linkIdArb,
    timestamp: timestampArb,
    referrer: fc.oneof(fc.constant('direct'), fc.webUrl(), fc.string()),
    device: fc.constantFrom(...deviceTypes),
    os: fc.constantFrom(...osTypes),
    country: fc.oneof(fc.constant('Unknown'), fc.string({ minLength: 2, maxLength: 3 })),
  }) as fc.Arbitrary<ClickEventWithLinkId>;

  // Generator for array of click events (may contain duplicates)
  const clickEventsArrayArb = fc.array(clickEventWithLinkIdArb, { minLength: 0, maxLength: 50 });

  /**
   * Property 13: Result length is less than or equal to input length
   * Deduplication should never increase the array size
   */
  it('should return array with length <= input length', () => {
    fc.assert(
      fc.property(
        clickEventsArrayArb,
        (events) => {
          const result = deduplicateEvents(events);
          
          expect(result.length).toBeLessThanOrEqual(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 13: No duplicates in result
   * The result should contain no duplicate (linkId, timestamp) pairs
   */
  it('should return array with no duplicate (linkId, timestamp) pairs', () => {
    fc.assert(
      fc.property(
        clickEventsArrayArb,
        (events) => {
          const result = deduplicateEvents(events);
          
          // Check for duplicates by creating keys
          const keys = result.map(e => `${e.linkId}:${e.timestamp}`);
          const uniqueKeys = new Set(keys);
          
          expect(keys.length).toBe(uniqueKeys.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: All result items exist in input
   * Every item in the result should be from the original input
   */
  it('should only contain items from the original input', () => {
    fc.assert(
      fc.property(
        clickEventsArrayArb,
        (events) => {
          const result = deduplicateEvents(events);
          
          // Every result item should be in the original array
          for (const resultItem of result) {
            const found = events.some(
              e => e.linkId === resultItem.linkId && 
                   e.timestamp === resultItem.timestamp &&
                   e.referrer === resultItem.referrer &&
                   e.device === resultItem.device &&
                   e.os === resultItem.os
            );
            expect(found).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Explicit duplicates are removed
   * When we intentionally add duplicates, the result should be smaller
   */
  it('should remove explicit duplicates', () => {
    fc.assert(
      fc.property(
        clickEventWithLinkIdArb,
        fc.integer({ min: 2, max: 10 }),
        (event, duplicateCount) => {
          // Create array with explicit duplicates
          const events = Array(duplicateCount).fill(event);
          const result = deduplicateEvents(events);
          
          // Should have exactly 1 item (all duplicates removed)
          expect(result.length).toBe(1);
          expect(result[0].linkId).toBe(event.linkId);
          expect(result[0].timestamp).toBe(event.timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Unique events are preserved
   * Events with different (linkId, timestamp) pairs should all be kept
   */
  it('should preserve all unique events', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            linkId: linkIdArb,
            timestamp: timestampArb,
            referrer: fc.constant('direct'),
            device: fc.constant('desktop' as const),
            os: fc.constant('windows' as const),
            country: fc.constant('US'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (events) => {
          // Make all events unique by giving them unique timestamps
          const uniqueEvents = events.map((e, i) => ({
            ...e,
            timestamp: e.timestamp + i * 1000, // Ensure unique timestamps
          })) as ClickEventWithLinkId[];
          
          const result = deduplicateEvents(uniqueEvents);
          
          // All unique events should be preserved
          expect(result.length).toBe(uniqueEvents.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Empty array returns empty array
   * Deduplication of empty array should return empty array
   */
  it('should return empty array for empty input', () => {
    const result = deduplicateEvents([]);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  /**
   * Property 13: Same linkId with different timestamps are kept
   * Events with same linkId but different timestamps are not duplicates
   */
  it('should keep events with same linkId but different timestamps', () => {
    fc.assert(
      fc.property(
        linkIdArb,
        fc.array(timestampArb, { minLength: 2, maxLength: 10 }),
        (linkId, timestamps) => {
          // Ensure timestamps are unique
          const uniqueTimestamps = [...new Set(timestamps)];
          
          const events: ClickEventWithLinkId[] = uniqueTimestamps.map(ts => ({
            linkId,
            timestamp: ts,
            referrer: 'direct',
            device: 'desktop',
            os: 'windows',
            country: 'US',
          }));
          
          const result = deduplicateEvents(events);
          
          // All events should be kept since timestamps are different
          expect(result.length).toBe(uniqueTimestamps.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Same timestamp with different linkIds are kept
   * Events with same timestamp but different linkIds are not duplicates
   */
  it('should keep events with same timestamp but different linkIds', () => {
    fc.assert(
      fc.property(
        timestampArb,
        fc.array(linkIdArb, { minLength: 2, maxLength: 10 }),
        (timestamp, linkIds) => {
          // Ensure linkIds are unique
          const uniqueLinkIds = [...new Set(linkIds)];
          
          const events: ClickEventWithLinkId[] = uniqueLinkIds.map(id => ({
            linkId: id,
            timestamp,
            referrer: 'direct',
            device: 'desktop',
            os: 'windows',
            country: 'US',
          }));
          
          const result = deduplicateEvents(events);
          
          // All events should be kept since linkIds are different
          expect(result.length).toBe(uniqueLinkIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: First occurrence is kept
   * When duplicates exist, the first occurrence should be preserved
   */
  it('should keep the first occurrence of duplicates', () => {
    fc.assert(
      fc.property(
        linkIdArb,
        timestampArb,
        fc.array(fc.constantFrom('direct', 'https://google.com', 'https://twitter.com'), { minLength: 2, maxLength: 5 }),
        (linkId, timestamp, referrers) => {
          // Create events with same linkId/timestamp but different referrers
          const events: ClickEventWithLinkId[] = referrers.map(ref => ({
            linkId,
            timestamp,
            referrer: ref,
            device: 'desktop',
            os: 'windows',
            country: 'US',
          }));
          
          const result = deduplicateEvents(events);
          
          // Should have exactly 1 item
          expect(result.length).toBe(1);
          // Should be the first one
          expect(result[0].referrer).toBe(referrers[0]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
