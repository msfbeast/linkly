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
  browserVersion: string;
  osVersion: string;
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
    browserVersion: detectBrowserVersion(ua),
    osVersion: detectOSVersion(ua),
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

/**
 * Detects the browser version from a lowercase user agent string.
 */
export function detectBrowserVersion(ua: string): string {
  const match =
    ua.match(/edg\/([\d.]+)/) ||
    ua.match(/opr\/([\d.]+)/) ||
    ua.match(/chrome\/([\d.]+)/) ||
    ua.match(/firefox\/([\d.]+)/) ||
    ua.match(/version\/([\d.]+)/); // Safari uses 'version/'

  return match ? match[1].split('.')[0] : 'Unknown';
}

/**
 * Detects the OS version from a lowercase user agent string.
 */
export function detectOSVersion(ua: string): string {
  if (/windows/.test(ua)) {
    const match = ua.match(/windows nt ([\d.]+)/);
    if (match) {
      const ver = match[1];
      if (ver === '10.0') return '10/11';
      if (ver === '6.3') return '8.1';
      if (ver === '6.2') return '8';
      if (ver === '6.1') return '7';
      return ver;
    }
  }

  if (/mac os x/.test(ua)) {
    const match = ua.match(/mac os x ([\d_]+)/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }

  if (/android/.test(ua)) {
    const match = ua.match(/android ([\d.]+)/);
    return match ? match[1] : 'Unknown';
  }

  if (/os ([\d_]+) like mac os x/.test(ua)) { // iOS
    const match = ua.match(/os ([\d_]+) like mac os x/);
    return match ? match[1].replace(/_/g, '.') : 'Unknown';
  }

  return 'Unknown';
}

/**
 * Detects the specific device model from user agent string.
 * Returns device name like "iPhone 15 Pro", "Samsung Galaxy S24", etc.
 */
export function detectDeviceModel(userAgent: string): string {
  const ua = userAgent;
  const uaLower = ua.toLowerCase();

  // iPhone models
  if (uaLower.includes('iphone')) {
    // Try to extract iPhone model from UA
    // Format: iPhone14,2 = iPhone 13 Pro, iPhone15,2 = iPhone 14 Pro, etc.
    const modelMatch = ua.match(/iPhone(\d+),(\d+)/i);
    if (modelMatch) {
      const major = parseInt(modelMatch[1]);
      const minor = parseInt(modelMatch[2]);
      return getIPhoneModel(major, minor);
    }
    return 'iPhone';
  }

  // iPad models
  if (uaLower.includes('ipad')) {
    return 'iPad';
  }

  // Samsung Galaxy devices
  const samsungMatch = ua.match(/SM-([A-Z]\d+[A-Z]?)/i);
  if (samsungMatch) {
    const model = samsungMatch[1].toUpperCase();
    return getSamsungModel(model);
  }

  // OnePlus
  if (uaLower.includes('oneplus')) {
    const opMatch = ua.match(/oneplus\s*([^\s;)]+)/i);
    return opMatch ? `OnePlus ${opMatch[1]}` : 'OnePlus';
  }

  // Xiaomi/Redmi
  if (uaLower.includes('redmi') || uaLower.includes('xiaomi')) {
    const xiMatch = ua.match(/(redmi|xiaomi)\s*([^\s;)]+)/i);
    return xiMatch ? `${xiMatch[1]} ${xiMatch[2]}` : 'Xiaomi';
  }

  // Pixel
  if (uaLower.includes('pixel')) {
    const pixelMatch = ua.match(/pixel\s*(\d+[a-z]*)/i);
    return pixelMatch ? `Pixel ${pixelMatch[1]}` : 'Pixel';
  }

  // Generic Android
  if (uaLower.includes('android')) {
    return 'Android Device';
  }

  // Desktop
  if (uaLower.includes('windows')) return 'Windows PC';
  if (uaLower.includes('macintosh') || uaLower.includes('mac os')) return 'Mac';
  if (uaLower.includes('linux')) return 'Linux PC';

  return 'Other';
}

function getIPhoneModel(major: number, minor: number): string {
  const models: Record<string, string> = {
    '17,1': 'iPhone 15 Pro', '17,2': 'iPhone 15 Pro Max', '17,3': 'iPhone 15', '17,4': 'iPhone 15 Plus',
    '16,1': 'iPhone 14 Pro', '16,2': 'iPhone 14 Pro Max', '15,4': 'iPhone 14', '15,5': 'iPhone 14 Plus',
    '15,2': 'iPhone 14 Pro', '15,3': 'iPhone 14 Pro Max',
    '14,2': 'iPhone 13 Pro', '14,3': 'iPhone 13 Pro Max', '14,4': 'iPhone 13 mini', '14,5': 'iPhone 13',
    '13,1': 'iPhone 12 mini', '13,2': 'iPhone 12', '13,3': 'iPhone 12 Pro', '13,4': 'iPhone 12 Pro Max',
    '12,1': 'iPhone 11', '12,3': 'iPhone 11 Pro', '12,5': 'iPhone 11 Pro Max',
  };
  const key = `${major},${minor}`;
  return models[key] || `iPhone (${key})`;
}

function getSamsungModel(model: string): string {
  // S series
  if (model.startsWith('S928')) return 'Galaxy S24 Ultra';
  if (model.startsWith('S926')) return 'Galaxy S24+';
  if (model.startsWith('S921')) return 'Galaxy S24';
  if (model.startsWith('S918')) return 'Galaxy S23 Ultra';
  if (model.startsWith('S916')) return 'Galaxy S23+';
  if (model.startsWith('S911')) return 'Galaxy S23';
  if (model.startsWith('S908')) return 'Galaxy S22 Ultra';
  if (model.startsWith('S906')) return 'Galaxy S22+';
  if (model.startsWith('S901')) return 'Galaxy S22';
  // A series
  if (model.startsWith('A55')) return 'Galaxy A55';
  if (model.startsWith('A54')) return 'Galaxy A54';
  if (model.startsWith('A53')) return 'Galaxy A53';
  if (model.startsWith('A52')) return 'Galaxy A52';
  if (model.startsWith('A34')) return 'Galaxy A34';
  if (model.startsWith('A14')) return 'Galaxy A14';
  // M series
  if (model.startsWith('M34')) return 'Galaxy M34';
  if (model.startsWith('M14')) return 'Galaxy M14';
  // Note/Fold/Flip
  if (model.startsWith('F946')) return 'Galaxy Z Fold5';
  if (model.startsWith('F731')) return 'Galaxy Z Flip5';

  return `Samsung ${model}`;
}
