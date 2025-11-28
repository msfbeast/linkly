/**
 * User Agent Parser Service
 * 
 * Parses user agent strings to extract device type and operating system information.
 * Used for click tracking analytics.
 */

export type DeviceType = 'Mobile' | 'Desktop' | 'Tablet' | 'Other';
export type OSType = 'iOS' | 'Android' | 'Windows' | 'MacOS' | 'Linux' | 'Other';
export type BrowserType = 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'Other';

export interface ParsedUserAgent {
  device: DeviceType;
  os: OSType;
  browser: BrowserType;
}

/**
 * Parses a user agent string to extract device type, operating system, and browser.
 * 
 * @param userAgent - The user agent string from the request
 * @returns An object containing the detected device type, OS, and browser
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();

  return {
    device: detectDevice(ua),
    os: detectOS(ua),
    browser: detectBrowser(ua),
  };
}

/**
 * Detects the device type from a lowercase user agent string.
 */
function detectDevice(ua: string): DeviceType {
  // Check for tablets first (before mobile, as some tablets include mobile keywords)
  if (isTablet(ua)) {
    return 'Tablet';
  }

  // Check for mobile devices
  if (isMobile(ua)) {
    return 'Mobile';
  }

  // Check for desktop indicators
  if (isDesktop(ua)) {
    return 'Desktop';
  }

  return 'Other';
}

/**
 * Checks if the user agent indicates a tablet device.
 */
function isTablet(ua: string): boolean {
  // iPad detection
  if (ua.includes('ipad')) {
    return true;
  }

  // Android tablets (have 'android' but not 'mobile')
  if (ua.includes('android') && !ua.includes('mobile')) {
    return true;
  }

  // Other tablet indicators
  const tabletPatterns = [
    'tablet',
    'kindle',
    'silk',
    'playbook',
    'nexus 7',
    'nexus 9',
    'nexus 10',
    'sm-t', // Samsung tablets
    'gt-p',  // Samsung tablets
  ];

  return tabletPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Checks if the user agent indicates a mobile device.
 */
function isMobile(ua: string): boolean {
  const mobilePatterns = [
    'mobile',
    'iphone',
    'ipod',
    'android',
    'blackberry',
    'windows phone',
    'opera mini',
    'opera mobi',
    'iemobile',
    'wpdesktop',
    'webos',
    'palm',
    'symbian',
    'nokia',
    'samsung',
    'lg-',
    'htc',
    'mot-',
    'sonyericsson',
  ];

  return mobilePatterns.some(pattern => ua.includes(pattern));
}

/**
 * Checks if the user agent indicates a desktop device.
 */
function isDesktop(ua: string): boolean {
  const desktopPatterns = [
    'windows nt',
    'macintosh',
    'mac os x',
    'linux x86',
    'linux i686',
    'linux amd64',
    'x11',
    'cros', // Chrome OS
  ];

  return desktopPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Detects the operating system from a lowercase user agent string.
 */
function detectOS(ua: string): OSType {
  // iOS detection (iPhone, iPad, iPod)
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'iOS';
  }

  // Android detection
  if (ua.includes('android')) {
    return 'Android';
  }

  // Windows detection
  if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) {
    return 'Windows';
  }

  // MacOS detection (but not iOS devices)
  if (ua.includes('macintosh') || ua.includes('mac os x')) {
    return 'MacOS';
  }

  // Linux detection (but not Android)
  if (ua.includes('linux') || ua.includes('x11')) {
    return 'Linux';
  }

  return 'Other';
}

/**
 * Detects the browser from a lowercase user agent string.
 */
function detectBrowser(ua: string): BrowserType {
  if (ua.includes('edg/')) {
    return 'Edge';
  }

  if (ua.includes('opr/') || ua.includes('opera')) {
    return 'Opera';
  }

  if (ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('edg/')) {
    return 'Chrome';
  }

  if (ua.includes('firefox')) {
    return 'Firefox';
  }

  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) {
    return 'Safari';
  }

  return 'Other';
}
