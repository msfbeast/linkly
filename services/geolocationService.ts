/**
 * Geolocation Service
 * 
 * Provides IP-based geolocation to determine visitor country.
 * Uses ip-api.com free API for lookups with fallback to "Unknown" on failure.
 */

export interface GeolocationResult {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  regionName?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  timezone?: string;
  ip?: string;
}

interface IpApiResponse {
  status: 'success' | 'fail';
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  regionName?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  timezone?: string;
  query?: string; // IP address returned by API
  message?: string;
}

const IP_API_BASE_URL = 'https://ipwho.is';
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Gets the country from an IP address using IP geolocation.
 * 
 * @param ipAddress - The IP address to look up
 * @returns The country name, or "Unknown" if lookup fails
 */
export async function getCountryFromIP(ipAddress: string): Promise<string> {
  try {
    // Validate IP address format (basic validation)
    if (!isValidIPAddress(ipAddress)) {
      return 'Unknown';
    }

    // Skip lookup for localhost/private IPs
    if (isPrivateIP(ipAddress)) {
      return 'Unknown';
    }

    const result = await fetchGeolocation(ipAddress);
    return result.country;
  } catch {
    // Per Requirements 2.5: If geolocation lookup fails, return "Unknown"
    return 'Unknown';
  }
}

/**
 * Gets detailed geolocation information from an IP address.
 * 
 * @param ipAddress - The IP address to look up
 * @returns GeolocationResult with country and countryCode
 */
export async function getGeolocation(ipAddress: string): Promise<GeolocationResult> {
  try {
    if (!isValidIPAddress(ipAddress) || isPrivateIP(ipAddress)) {
      return { country: 'Unknown', countryCode: 'XX' };
    }

    return await fetchGeolocation(ipAddress);
  } catch {
    return { country: 'Unknown', countryCode: 'XX' };
  }
}

/**
 * Fetches geolocation data from the IP API.
 */
async function fetchGeolocation(ipAddress: string): Promise<GeolocationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${IP_API_BASE_URL}/${encodeURIComponent(ipAddress)}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success === false) {
      throw new Error(data.message || 'Geolocation lookup failed');
    }

    return {
      country: data.country || 'Unknown',
      countryCode: data.country_code || 'XX',
      city: data.city,
      region: data.region_code,
      regionName: data.region,
      lat: data.latitude,
      lon: data.longitude,
      isp: data.connection?.isp || data.isp,
      timezone: data.timezone?.id,
      ip: data.ip,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Basic validation for IP address format (IPv4 and IPv6).
 */
function isValidIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Pattern.test(ip)) {
    return true;
  }

  // IPv6 with IPv4 suffix
  const ipv6v4Pattern = /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
  return ipv6v4Pattern.test(ip);
}

/**
 * Checks if an IP address is private/local (not routable on the internet).
 */
function isPrivateIP(ip: string): boolean {
  // Localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  // IPv4 private ranges
  const parts = ip.split('.').map(Number);
  if (parts.length === 4) {
    // 10.0.0.0/8
    if (parts[0] === 10) {
      return true;
    }
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) {
      return true;
    }
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) {
      return true;
    }
  }

  return false;
}

// Export for testing
export { isValidIPAddress, isPrivateIP };
