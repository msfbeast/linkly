import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateClickEvent } from '../clickTrackingService';
import { ClickEventInput } from '../storage/types';

/**
 * **Feature: production-analytics, Property 12: Click event validation rejects invalid data**
 * **Validates: Requirements 6.3**
 * 
 * For any ClickEventInput with missing or invalid required fields
 * (empty linkId, negative timestamp), validation SHALL reject the event.
 */
describe('Click Event Validation Property Tests', () => {
  // Generator for valid timestamps
  const validTimestampArb = fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 });

  // Generator for valid linkIds (non-empty strings)
  const validLinkIdArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

  // Generator for valid referrers (any string including empty)
  const validReferrerArb = fc.string();

  // Generator for valid user agents
  const validUserAgentArb = fc.string();

  // Generator for valid IP addresses
  const validIpAddressArb = fc.string();

  // Generator for valid ClickEventInput
  const validClickEventInputArb = fc.record({
    timestamp: validTimestampArb,
    referrer: validReferrerArb,
    userAgent: validUserAgentArb,
    ipAddress: validIpAddressArb,
  });

  // Generator for invalid linkIds (empty or whitespace-only)
  const invalidLinkIdArb = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('\t\n'),
    fc.constant('  \t  '),
    fc.constant('\n\n\n')
  );

  // Generator for negative timestamps
  const negativeTimestampArb = fc.integer({ min: -1000000000, max: -1 });

  /**
   * Property 12: Valid inputs should pass validation
   * For any valid linkId and valid ClickEventInput, validation should succeed
   */
  it('should accept valid click events with all required fields', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        validClickEventInputArb,
        (linkId, event) => {
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 12: Empty linkId should be rejected
   * For any empty or whitespace-only linkId, validation should fail
   */
  it('should reject click events with empty linkId', () => {
    fc.assert(
      fc.property(
        invalidLinkIdArb,
        validClickEventInputArb,
        (linkId, event) => {
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.toLowerCase().includes('linkid'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Negative timestamp should be rejected
   * For any negative timestamp, validation should fail
   */
  it('should reject click events with negative timestamp', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        negativeTimestampArb,
        validReferrerArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, timestamp, referrer, userAgent, ipAddress) => {
          const event: ClickEventInput = { timestamp, referrer, userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.toLowerCase().includes('timestamp'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Missing timestamp should be rejected
   * For any event without a timestamp, validation should fail
   */
  it('should reject click events with missing timestamp', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        validReferrerArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, referrer, userAgent, ipAddress) => {
          const event: Partial<ClickEventInput> = { referrer, userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.toLowerCase().includes('timestamp'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Missing referrer should be rejected
   * For any event without a referrer, validation should fail
   */
  it('should reject click events with missing referrer', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        validTimestampArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, timestamp, userAgent, ipAddress) => {
          const event: Partial<ClickEventInput> = { timestamp, userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.toLowerCase().includes('referrer'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Non-finite timestamp should be rejected
   * For any non-finite timestamp (NaN, Infinity), validation should fail
   */
  it('should reject click events with non-finite timestamp', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        fc.constantFrom(NaN, Infinity, -Infinity),
        validReferrerArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, timestamp, referrer, userAgent, ipAddress) => {
          const event: ClickEventInput = { timestamp, referrer, userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.toLowerCase().includes('timestamp'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Multiple invalid fields should all be reported
   * When multiple fields are invalid, all errors should be reported
   */
  it('should report all validation errors when multiple fields are invalid', () => {
    fc.assert(
      fc.property(
        invalidLinkIdArb,
        negativeTimestampArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, timestamp, userAgent, ipAddress) => {
          // Missing referrer and invalid linkId and timestamp
          const event: Partial<ClickEventInput> = { timestamp, userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(false);
          // Should have at least 3 errors: linkId, timestamp, referrer
          expect(result.errors.length).toBeGreaterThanOrEqual(3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Empty string referrer should be accepted
   * Empty string is a valid referrer (will be normalized to 'direct' later)
   */
  it('should accept empty string as valid referrer', () => {
    fc.assert(
      fc.property(
        validLinkIdArb,
        validTimestampArb,
        validUserAgentArb,
        validIpAddressArb,
        (linkId, timestamp, userAgent, ipAddress) => {
          const event: ClickEventInput = { timestamp, referrer: '', userAgent, ipAddress };
          const result = validateClickEvent(linkId, event);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
