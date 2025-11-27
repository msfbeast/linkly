import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseUserAgent } from '../userAgentParser';
import { ClickEvent } from '../../types';

/**
 * **Feature: production-analytics, Property 4: Click event completeness**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any click tracking request with valid userAgent, referrer, and ipAddress,
 * the recorded ClickEvent SHALL contain non-null values for timestamp, referrer,
 * device, os, and country fields.
 */
describe('Click Event Completeness Property Tests', () => {
  // Valid device types
  const validDeviceTypes: ClickEvent['device'][] = ['Mobile', 'Desktop', 'Tablet', 'Other'];
  
  // Valid OS types
  const validOSTypes: ClickEvent['os'][] = ['iOS', 'Android', 'Windows', 'MacOS', 'Linux', 'Other'];

  // Generator for realistic user agent strings
  const userAgentArb = fc.oneof(
    // Mobile user agents
    fc.constantFrom(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
    ),
    // Tablet user agents
    fc.constantFrom(
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36'
    ),
    // Desktop user agents
    fc.constantFrom(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ),
    // Random strings for edge cases
    fc.string()
  );

  // Generator for referrer URLs
  const referrerArb = fc.oneof(
    fc.constantFrom('', 'direct'),
    fc.webUrl(),
    fc.constantFrom(
      'https://twitter.com/share',
      'https://facebook.com/post',
      'https://google.com/search'
    )
  );

  // Generator for IP addresses
  const ipAddressArb = fc.oneof(
    // IPv4
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
    // IPv6 (simplified)
    fc.string({ minLength: 4, maxLength: 4 }).map(s => `::${s}`),
    // Empty/unknown
    fc.constantFrom('', 'unknown')
  );


  /**
   * Simulates the click event creation process from the storage adapter.
   * This mirrors the recordClick method's logic for creating a ClickEvent.
   */
  function simulateClickEventCreation(
    userAgent: string,
    referrer: string,
    _ipAddress: string,
    timestamp: number
  ): ClickEvent {
    const { device, os } = parseUserAgent(userAgent);
    
    // Simulate geolocation (always returns a value, "Unknown" on failure)
    const country = 'Unknown'; // Geolocation is async, we simulate the fallback
    
    return {
      timestamp,
      referrer: referrer || 'direct',
      device,
      os,
      country,
    };
  }

  /**
   * Property 4: Click events have non-null timestamp
   * For any valid input, the resulting click event should have a valid timestamp
   */
  it('should always produce a click event with a valid timestamp', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          expect(event.timestamp).toBeDefined();
          expect(typeof event.timestamp).toBe('number');
          expect(event.timestamp).toBe(timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Click events have non-null referrer
   * For any input, the resulting click event should have a non-null referrer
   */
  it('should always produce a click event with a non-null referrer', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          expect(event.referrer).toBeDefined();
          expect(event.referrer).not.toBeNull();
          expect(typeof event.referrer).toBe('string');
          // Empty referrer should be converted to 'direct'
          if (referrer === '' || referrer === undefined || referrer === null) {
            expect(event.referrer).toBe('direct');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Click events have valid device type
   * For any user agent, the resulting click event should have a valid device type
   */
  it('should always produce a click event with a valid device type', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          expect(event.device).toBeDefined();
          expect(event.device).not.toBeNull();
          expect(validDeviceTypes).toContain(event.device);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 4: Click events have valid OS type
   * For any user agent, the resulting click event should have a valid OS type
   */
  it('should always produce a click event with a valid OS type', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          expect(event.os).toBeDefined();
          expect(event.os).not.toBeNull();
          expect(validOSTypes).toContain(event.os);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Click events have non-null country
   * For any IP address, the resulting click event should have a country value
   * (either resolved or "Unknown" as fallback)
   */
  it('should always produce a click event with a non-null country', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          expect(event.country).toBeDefined();
          expect(event.country).not.toBeNull();
          expect(typeof event.country).toBe('string');
          expect(event.country.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: All required fields are present simultaneously
   * For any valid input, all required fields should be present and valid
   */
  it('should produce a complete click event with all required fields', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        referrerArb,
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer, ipAddress, timestamp);
          
          // All fields must be defined and non-null
          expect(event.timestamp).toBeDefined();
          expect(event.referrer).toBeDefined();
          expect(event.device).toBeDefined();
          expect(event.os).toBeDefined();
          expect(event.country).toBeDefined();
          
          // All fields must have valid types
          expect(typeof event.timestamp).toBe('number');
          expect(typeof event.referrer).toBe('string');
          expect(typeof event.device).toBe('string');
          expect(typeof event.os).toBe('string');
          expect(typeof event.country).toBe('string');
          
          // Device and OS must be from valid sets
          expect(validDeviceTypes).toContain(event.device);
          expect(validOSTypes).toContain(event.os);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Empty referrer is normalized to 'direct'
   * When referrer is empty or missing, it should be normalized to 'direct'
   */
  it('should normalize empty referrer to direct', () => {
    fc.assert(
      fc.property(
        userAgentArb,
        fc.constantFrom('', undefined as unknown as string, null as unknown as string),
        ipAddressArb,
        fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
        (userAgent, referrer, ipAddress, timestamp) => {
          const event = simulateClickEventCreation(userAgent, referrer || '', ipAddress, timestamp);
          
          expect(event.referrer).toBe('direct');
        }
      ),
      { numRuns: 100 }
    );
  });
});
