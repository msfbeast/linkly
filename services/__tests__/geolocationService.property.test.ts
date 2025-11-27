import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getCountryFromIP, isValidIPAddress, isPrivateIP } from '../geolocationService';

/**
 * **Feature: production-analytics, Property 6: Geolocation fallback**
 * **Validates: Requirements 2.5**
 * 
 * For any IP address where geolocation lookup fails, getCountryFromIP SHALL return
 * "Unknown" rather than throwing an error.
 */
describe('GeolocationService Property Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Property 6: Fallback on network failure
   * For any valid IP address, when the network request fails, return "Unknown"
   */
  it('should return "Unknown" when fetch throws an error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    // Generator for valid public IPv4 addresses
    const publicIPv4Generator = fc.tuple(
      fc.integer({ min: 1, max: 223 }).filter(n => n !== 10 && n !== 127),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).filter(([a, b]) => {
      // Exclude private ranges
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      return true;
    }).map(parts => parts.join('.'));

    await fc.assert(
      fc.asyncProperty(
        publicIPv4Generator,
        async (ipAddress) => {
          const result = await getCountryFromIP(ipAddress);
          expect(result).toBe('Unknown');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Fallback on HTTP error response
   * For any valid IP address, when the API returns an error status, return "Unknown"
   */
  it('should return "Unknown" when API returns HTTP error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', mockFetch);

    const publicIPv4Generator = fc.tuple(
      fc.integer({ min: 1, max: 223 }).filter(n => n !== 10 && n !== 127),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).filter(([a, b]) => {
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      return true;
    }).map(parts => parts.join('.'));

    await fc.assert(
      fc.asyncProperty(
        publicIPv4Generator,
        async (ipAddress) => {
          const result = await getCountryFromIP(ipAddress);
          expect(result).toBe('Unknown');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Fallback on API failure response
   * For any valid IP address, when the API returns status: 'fail', return "Unknown"
   */
  it('should return "Unknown" when API returns fail status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'fail', message: 'Invalid IP' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const publicIPv4Generator = fc.tuple(
      fc.integer({ min: 1, max: 223 }).filter(n => n !== 10 && n !== 127),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).filter(([a, b]) => {
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      return true;
    }).map(parts => parts.join('.'));

    await fc.assert(
      fc.asyncProperty(
        publicIPv4Generator,
        async (ipAddress) => {
          const result = await getCountryFromIP(ipAddress);
          expect(result).toBe('Unknown');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Fallback for invalid IP addresses
   * For any invalid IP address string, return "Unknown" without making API call
   */
  it('should return "Unknown" for invalid IP addresses without calling API', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Generator for invalid IP-like strings
    const invalidIPGenerator = fc.oneof(
      fc.constant(''),
      fc.constant('not-an-ip'),
      fc.constant('256.256.256.256'),
      fc.constant('1.2.3'),
      fc.constant('1.2.3.4.5'),
      fc.string().filter(s => !isValidIPAddress(s))
    );

    await fc.assert(
      fc.asyncProperty(
        invalidIPGenerator,
        async (invalidIP) => {
          const result = await getCountryFromIP(invalidIP);
          expect(result).toBe('Unknown');
          // Should not call fetch for invalid IPs
          expect(mockFetch).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Fallback for private/local IP addresses
   * For any private IP address, return "Unknown" without making API call
   */
  it('should return "Unknown" for private IP addresses without calling API', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Generator for private IP addresses
    const privateIPGenerator = fc.oneof(
      fc.constant('127.0.0.1'),
      fc.constant('::1'),
      fc.constant('localhost'),
      // 10.x.x.x
      fc.tuple(
        fc.constant(10),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(parts => parts.join('.')),
      // 172.16-31.x.x
      fc.tuple(
        fc.constant(172),
        fc.integer({ min: 16, max: 31 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(parts => parts.join('.')),
      // 192.168.x.x
      fc.tuple(
        fc.constant(192),
        fc.constant(168),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(parts => parts.join('.'))
    );

    await fc.assert(
      fc.asyncProperty(
        privateIPGenerator,
        async (privateIP) => {
          mockFetch.mockClear();
          const result = await getCountryFromIP(privateIP);
          expect(result).toBe('Unknown');
          expect(mockFetch).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Never throws an error
   * For any input string, getCountryFromIP should never throw
   */
  it('should never throw an error for any input', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        async (input) => {
          // Should not throw, should return a string
          const result = await getCountryFromIP(input);
          expect(typeof result).toBe('string');
          // Result should be either "Unknown" or a valid country name
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Successful lookup returns country name
   * For any valid public IP, when API succeeds, return the country name
   */
  it('should return country name when API succeeds', async () => {
    const countries = ['United States', 'Canada', 'Germany', 'Japan', 'Brazil'];
    
    const mockFetch = vi.fn().mockImplementation(() => {
      const country = countries[Math.floor(Math.random() * countries.length)];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          country,
          countryCode: 'XX',
        }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const publicIPv4Generator = fc.tuple(
      fc.integer({ min: 1, max: 223 }).filter(n => n !== 10 && n !== 127),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).filter(([a, b]) => {
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      return true;
    }).map(parts => parts.join('.'));

    await fc.assert(
      fc.asyncProperty(
        publicIPv4Generator,
        async (ipAddress) => {
          const result = await getCountryFromIP(ipAddress);
          expect(countries).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('IP Validation Helper Tests', () => {
  /**
   * Valid IPv4 addresses should be recognized
   */
  it('should validate correct IPv4 addresses', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ),
        (parts) => {
          const ip = parts.join('.');
          expect(isValidIPAddress(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Private IP detection should correctly identify private ranges
   */
  it('should correctly identify private IP ranges', () => {
    // 10.x.x.x range
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ),
        ([b, c, d]) => {
          const ip = `10.${b}.${c}.${d}`;
          expect(isPrivateIP(ip)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
