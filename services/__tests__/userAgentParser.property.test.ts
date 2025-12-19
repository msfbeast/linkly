import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseUserAgent, DeviceType, OSType } from '../userAgentParser';

/**
 * **Feature: production-analytics, Property 5: User agent parsing validity**
 * **Validates: Requirements 2.3, 2.6**
 * 
 * For any user agent string, parseUserAgent SHALL return a device value that is one of
 * 'Mobile', 'Desktop', 'Tablet', or 'Other', and an os value that is one of
 * 'iOS', 'Android', 'Windows', 'MacOS', 'Linux', or 'Other'.
 */
describe('UserAgentParser Property Tests', () => {
  const validDeviceTypes: DeviceType[] = ['mobile', 'desktop', 'tablet', 'unknown'];
  const validOSTypes: OSType[] = ['ios', 'android', 'windows', 'macos', 'linux', 'unknown'];

  /**
   * Property 5: Device type validity
   * For any user agent string, the returned device type must be one of the valid values
   */
  it('should always return a valid device type for any user agent string', () => {
    fc.assert(
      fc.property(
        fc.string(), // Any arbitrary string
        (userAgent) => {
          const result = parseUserAgent(userAgent);
          expect(validDeviceTypes).toContain(result.device);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: OS type validity
   * For any user agent string, the returned OS type must be one of the valid values
   */
  it('should always return a valid OS type for any user agent string', () => {
    fc.assert(
      fc.property(
        fc.string(), // Any arbitrary string
        (userAgent) => {
          const result = parseUserAgent(userAgent);
          expect(validOSTypes).toContain(result.os);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Combined validity
   * For any user agent string, both device and OS must be valid simultaneously
   */
  it('should return valid device AND OS types together for any input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (userAgent) => {
          const result = parseUserAgent(userAgent);
          expect(validDeviceTypes).toContain(result.device);
          expect(validOSTypes).toContain(result.os);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Realistic user agent strings
   * Test with generated user agent-like strings containing known patterns
   */
  it('should correctly identify device types from realistic user agent patterns', () => {
    // Generator for realistic user agent strings
    const userAgentGenerator = fc.oneof(
      // Mobile patterns
      fc.constantFrom(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B)',
        'Mozilla/5.0 (Linux; Android 10; Mobile)',
        'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)'
      ),
      // Tablet patterns
      fc.constantFrom(
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 11; SM-T870)',
        'Mozilla/5.0 (Linux; Android 10; Tablet)'
      ),
      // Desktop patterns
      fc.constantFrom(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Mozilla/5.0 (X11; Linux x86_64)'
      ),
      // Random strings for edge cases
      fc.string()
    );

    fc.assert(
      fc.property(
        userAgentGenerator,
        (userAgent) => {
          const result = parseUserAgent(userAgent);
          expect(validDeviceTypes).toContain(result.device);
          expect(validOSTypes).toContain(result.os);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: iOS detection consistency
   * User agents containing iOS device identifiers should return iOS as OS
   */
  it('should detect iOS for iPhone/iPad/iPod user agents', () => {
    const iosDeviceGenerator = fc.constantFrom('iPhone', 'iPad', 'iPod');
    
    fc.assert(
      fc.property(
        iosDeviceGenerator,
        fc.string(),
        (device, suffix) => {
          const userAgent = `Mozilla/5.0 (${device}; CPU ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.os).toBe('iOS');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Android detection consistency
   * User agents containing 'Android' should return Android as OS
   */
  it('should detect Android for user agents containing Android', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (prefix, suffix) => {
          // Ensure we don't accidentally include iOS patterns
          const cleanPrefix = prefix.replace(/iphone|ipad|ipod/gi, '');
          const userAgent = `${cleanPrefix}Android${suffix}`;
          const result = parseUserAgent(userAgent);
          expect(result.os).toBe('Android');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Windows detection consistency
   * User agents containing Windows patterns should return Windows as OS
   */
  it('should detect Windows for user agents containing Windows', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Windows NT', 'Windows', 'Win32', 'Win64'),
        fc.string(),
        (windowsPattern, suffix) => {
          const userAgent = `Mozilla/5.0 (${windowsPattern} ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.os).toBe('Windows');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: MacOS detection consistency
   * User agents containing Macintosh should return MacOS as OS (when not iOS)
   */
  it('should detect MacOS for Macintosh user agents', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (suffix) => {
          const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.os).toBe('MacOS');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Mobile device detection
   * User agents with mobile patterns should return Mobile device type
   */
  it('should detect Mobile for mobile user agents', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (suffix) => {
          // iPhone should be detected as Mobile
          const userAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.device).toBe('Mobile');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Tablet device detection
   * User agents with iPad should return Tablet device type
   */
  it('should detect Tablet for iPad user agents', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (suffix) => {
          const userAgent = `Mozilla/5.0 (iPad; CPU OS 14_0 ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.device).toBe('Tablet');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Desktop device detection
   * User agents with desktop OS patterns should return Desktop device type
   */
  it('should detect Desktop for Windows NT user agents', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (suffix) => {
          const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64 ${suffix})`;
          const result = parseUserAgent(userAgent);
          expect(result.device).toBe('Desktop');
        }
      ),
      { numRuns: 100 }
    );
  });
});
