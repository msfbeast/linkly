/**
 * Device / OS / browser from a user-agent string, in the values click
 * analytics already store ('Mobile', 'Windows 10', 'Chrome', ...).
 *
 * Ported from supabase/functions/track-click with one fix: iPhones and
 * iPads send "like Mac OS X", so they were recorded as MacOS. They are now
 * checked first and recorded as iOS.
 */
export interface ParsedUserAgent {
    device: 'Desktop' | 'Mobile' | 'Tablet';
    os: string;
    browser: string;
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
    const s = ua || '';

    let device: ParsedUserAgent['device'] = 'Desktop';
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(s)) {
        device = /tablet|ipad/i.test(s) ? 'Tablet' : 'Mobile';
    }

    let os = 'Unknown';
    if (/windows nt 10/i.test(s)) os = 'Windows 10';
    else if (/windows nt 6\.3/i.test(s)) os = 'Windows 8.1';
    else if (/windows nt 6\.2/i.test(s)) os = 'Windows 8';
    else if (/windows nt 6\.1/i.test(s)) os = 'Windows 7';
    else if (/windows/i.test(s)) os = 'Windows';
    else if (/iphone|ipad|ipod/i.test(s)) os = 'iOS';
    else if (/mac os x/i.test(s)) os = 'MacOS';
    else if (/android/i.test(s)) os = 'Android';
    else if (/cros/i.test(s)) os = 'ChromeOS';
    else if (/linux/i.test(s)) os = 'Linux';

    let browser = 'Unknown';
    if (/edg/i.test(s)) browser = 'Edge';
    else if (/opera|opr\//i.test(s)) browser = 'Opera';
    else if (/firefox|fxios/i.test(s)) browser = 'Firefox';
    else if (/chrome|crios/i.test(s) && !/chromium/i.test(s)) browser = 'Chrome';
    else if (/safari/i.test(s)) browser = 'Safari';
    else if (/msie|trident/i.test(s)) browser = 'IE';

    return { device, os, browser };
}
