import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowRight, Globe, Lock } from 'lucide-react';
import { LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { isSupabaseConfigured } from '../services/storage/supabaseClient';
import { createClickEventInput, validateClickEvent } from '../services/clickTrackingService';
import { getLinkByCode as getLocalLinkByCode, incrementClicks } from '../services/storageService';
import { getAppDeepLink } from '../utils/appDeepLinking';
import { detectDeviceModel } from '../services/userAgentParser';

import { useParams } from 'react-router-dom';

interface RedirectProps {
  code?: string;
}

const Redirect: React.FC<RedirectProps> = ({ code: propCode }) => {
  const { code: paramCode } = useParams<{ code: string }>();
  const code = propCode || paramCode || '';

  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [redirectMsg, setRedirectMsg] = useState('Analyzing request...');
  const [detectedLocale, setDetectedLocale] = useState<string>('');

  // Password State
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [targetLink, setTargetLink] = useState<LinkData | null>(null);
  const processedCode = React.useRef<string | null>(null);

  useEffect(() => {
    // Prevent double execution (React Strict Mode or re-renders)
    if (!code || processedCode.current === code) return;
    processedCode.current = code;

    const fetchLink = async () => {
      try {
        let link: LinkData | null | undefined = null;

        // Try cache-first approach for maximum performance
        if (isSupabaseConfigured()) {
          // Direct Supabase call (safe for browser)
          // Note: cacheService uses Redis which is not browser-compatible
          link = await supabaseAdapter.getLinkByCode(code);
        } else {
          // Fallback to localStorage for local development
          link = getLocalLinkByCode(code);
        }

        if (link) {
          setTargetLink(link);

          // 1. Check Expiration and Start Date
          const now = Date.now();
          if (link.expirationDate && now > link.expirationDate) {
            setError("This link has expired.");
            return;
          }

          if (link.startDate && now < link.startDate) {
            setError("This link is not yet active.");
            return;
          }

          // 2. Check Click Limits
          if (link.maxClicks && link.clicks >= link.maxClicks) {
            setError("This link has reached its click limit.");
            return;
          }

          // 3. Check Password
          if (link.password) {
            setIsLocked(true);
            return;
          }

          // 4. Check Link Type (Widgets cannot be visited directly)
          // Try to resolve underlying content URL if possible
          const isWidget = (link.type && link.type !== 'link' && ['music', 'map', 'video', 'social_feed'].includes(link.type));
          const isWidgetUrl = link.originalUrl?.trim().toLowerCase().startsWith('widget://');

          if (isWidget || isWidgetUrl) {
            // Attempt to find a valid redirect URL for the widget
            // Preference: metadata.embedUrl -> metadata.url -> originalUrl (if not widget://)
            const validRedirect = link.metadata?.embedUrl || link.metadata?.url || (!isWidgetUrl ? link.originalUrl : null);

            if (validRedirect && !validRedirect.trim().toLowerCase().startsWith('widget://')) {
              // Redirect to the underlying content
              link.originalUrl = validRedirect;
              // Proceed to processRedirect
            } else {
              setError("This link represents a embedded widget and cannot be visited directly.");
              return;
            }
          }

          // If no password and valid type, proceed
          await processRedirect(link);
        } else {
          setError("Link not found");
        }
      } catch (err) {
        console.error('Error fetching link:', err);
        setError("An error occurred while loading the link.");
      }
    };

    fetchLink();
  }, [code]);

  /**
   * Captures detailed device fingerprint data for analytics.
   * This data is sent to the Edge Function for server-side processing.
   */
  /**
   * Generates a privacy-preserving visitor hash.
   * Uses SHA-256 on (UserAgent + IP + Date + Salt) to create a daily unique ID
   * without storing persistent cookies or PII.
   */
  const generateVisitorHash = async (ip: string, ua: string): Promise<string> => {
    const today = new Date().toISOString().split('T')[0]; // Daily rotation
    const salt = 'gather-privacy-salt'; // In prod, this should be an env var
    const data = `${ua}|${ip}|${today}|${salt}`;

    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  /**
   * Captures detailed device fingerprint data for analytics.
   * Fetches IP for hashing but does NOT store it.
   */
  const captureDeviceFingerprint = async () => {
    // Fetch IP for fingerprinting (not stored)
    let ip = '';
    try {
      // We use the geolocation service to get the IP
      // Note: In a real edge function, the IP is available in headers.
      // Here we fetch it from the client side.
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ip = data.ip;
    } catch (e) {
      console.warn('Failed to fetch IP for fingerprinting');
    }

    const ua = navigator.userAgent || '';
    const visitorId = await generateVisitorHash(ip, ua);

    return {
      userAgent: ua,
      referrer: document.referrer || '',
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      colorDepth: window.screen?.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      visitorId,
      ipAddress: ip, // Passed for geolocation lookup, but not stored raw
      deviceModel: detectDeviceModel(ua), // Detailed device model (e.g. iPhone 15)
    };
  };

  /**
   * Records a click event using the Edge Function for detailed analytics.
   * Falls back to direct Supabase insert if Edge Function is unavailable.
   * 
   * Requirements: 2.1, 2.2
   */
  const recordClick = async (link: LinkData, destinationUrl?: string): Promise<void> => {
    const fingerprint = await captureDeviceFingerprint();

    console.log('[Click Tracking] Starting click recording for link:', link.id);
    console.log('[Click Tracking] Device fingerprint:', fingerprint);
    console.log('[Click Tracking] Supabase configured:', isSupabaseConfigured());

    try {
      // Try Edge Function first for detailed analytics with IP geolocation
      const edgeFunctionUrl = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1/track-click');

      if (edgeFunctionUrl && isSupabaseConfigured()) {
        console.log('[Click Tracking] Calling Edge Function...');

        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            linkId: link.id,
            shortCode: link.shortCode,
            destinationUrl, // Pass destination URL for A/B testing
            ...fingerprint,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[Click Tracking] Edge Function success:', result);
          return;
        } else {
          console.warn('[Click Tracking] Edge Function failed, falling back to direct insert');
        }
      }

      // Fallback to direct Supabase insert
      if (isSupabaseConfigured()) {
        console.log('[Click Tracking] Recording click via Supabase directly...');

        // Extract UTM and QR params
        const searchParams = new URLSearchParams(window.location.search);

        const clickEventInput = createClickEventInput({
          userAgent: fingerprint.userAgent,
          referrer: fingerprint.referrer,
          ipAddress: fingerprint.ipAddress,
          utm_source: searchParams.get('utm_source') || undefined,
          utm_medium: searchParams.get('utm_medium') || undefined,
          utm_campaign: searchParams.get('utm_campaign') || undefined,
          utm_term: searchParams.get('utm_term') || undefined,
          utm_content: searchParams.get('utm_content') || undefined,
          trigger_source: searchParams.get('qr') === '1' ? 'qr' : 'link',
          // Advanced Analytics
          language: fingerprint.language,
          timezone: fingerprint.timezone,
          screenWidth: fingerprint.screenWidth,
          screenHeight: fingerprint.screenHeight,
          visitorId: fingerprint.visitorId,
          destinationUrl, // Pass destination URL for A/B testing
        }, Date.now());

        await supabaseAdapter.recordClick(link.id, clickEventInput);
        console.log('[Click Tracking] Click recorded successfully!');
      } else {
        console.log('[Click Tracking] Supabase not configured, using localStorage');
        incrementClicks(link.id);
      }
    } catch (recordError) {
      // Log error but don't fail the redirect - graceful degradation
      console.error('[Click Tracking] Failed to record click:', recordError);

      // Last resort fallback
      try {
        if (isSupabaseConfigured()) {
          const clickEventInput = createClickEventInput({
            userAgent: fingerprint.userAgent,
            referrer: fingerprint.referrer,
            ipAddress: fingerprint.ipAddress,
            // Advanced Analytics
            language: fingerprint.language,
            timezone: fingerprint.timezone,
            screenWidth: fingerprint.screenWidth,
            screenHeight: fingerprint.screenHeight,
            visitorId: fingerprint.visitorId,
            destinationUrl, // Pass destination URL for A/B testing
          }, Date.now());
          await supabaseAdapter.recordClick(link.id, clickEventInput);
        }
      } catch {
        console.error('[Click Tracking] All tracking methods failed');
      }
    }
  };

  const processRedirect = async (link: LinkData) => {
    const ua = navigator.userAgent;
    // Heuristic for country detection based on browser locale (e.g. en-US -> US)
    const userLocale = navigator.language || 'en-US';
    const userCountry = userLocale.split('-')[1] || 'US';
    setDetectedLocale(userCountry);

    let finalUrl = link.originalUrl;

    // 1. A/B Testing Logic
    if (link.abTestConfig?.enabled && link.abTestConfig.variants.length > 0) {
      const random = Math.random() * 100;
      let cumulativeWeight = 0;

      // Default to original URL (Variant A usually) if something goes wrong
      // But typically we treat originalUrl as one of the variants or separate?
      // Implementation Plan said: variants list.
      // Let's assume variants list contains ALL options including "original" if user added it there.
      // Or we can treat originalUrl as fallback.

      for (const variant of link.abTestConfig.variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          finalUrl = variant.url;
          setRedirectMsg("Redirecting to test variant...");
          break;
        }
      }
    }

    // 2. Device Check (Overrides A/B if specific device rule exists? Or A/B first? 
    // Usually A/B is for the main destination. Smart Redirects are for specific devices.
    // Let's keep Smart Redirects as higher priority for specific devices, 
    // but A/B applies to the "default" traffic.)
    if (link.smartRedirects) {
      if (/iPad|iPhone|iPod/.test(ua) && link.smartRedirects.ios) {
        finalUrl = link.smartRedirects.ios;
        setRedirectMsg("Opening in iOS App...");
      } else if (/android/i.test(ua) && link.smartRedirects.android) {
        finalUrl = link.smartRedirects.android;
        setRedirectMsg("Opening in Android App...");
      } else if (!/Mobile/.test(ua) && link.smartRedirects.desktop) {
        finalUrl = link.smartRedirects.desktop;
      }
    }

    // 3. Geo Check (Overrides Device if specific geo rule exists)
    if (link.geoRedirects) {
      const geoUrl = link.geoRedirects[userCountry.toUpperCase()];
      if (geoUrl) {
        finalUrl = geoUrl;
        setRedirectMsg(`Redirecting for ${userCountry}...`);
      }
    }

    // Ensure finalUrl is valid
    if (!finalUrl || finalUrl.trim().toLowerCase().startsWith('widget://')) {
      setError("Invalid destination URL. Direct access to widgets is not supported.");
      return;
    }

    // Append lcid for conversion tracking - REMOVED to prevent WAF blocking
    // const lcid = crypto.randomUUID();
    // const separator = finalUrl.includes('?') ? '&' : '?';
    // finalUrl = `${finalUrl}${separator}lcid=${lcid}`;

    setDestination(finalUrl);

    // Record click with full metadata capture before redirect
    recordClick(link, finalUrl).catch(err => {
      console.error('Click recording failed:', err);
    });

    // Smart App Redirect
    // Try to detect if we can open an app directly
    const deepLink = getAppDeepLink(finalUrl, navigator.userAgent);

    if (deepLink) {
      console.log('Attempting deep link:', deepLink);
      setRedirectMsg("Opening App...");

      // Try to open the app
      // For Intent URIs (Android), replace() is often cleaner and matches competitor logic
      if (deepLink.startsWith('intent://')) {
        window.location.replace(deepLink);
      } else {
        window.location.href = deepLink;
      }

      // Fallback to web URL if app doesn't open within 2.5s
      // Note: If app opens, this timeout might still fire when user returns, 
      // but usually the browser backgrounding prevents immediate execution.
      setTimeout(() => {
        window.location.replace(finalUrl);
      }, 2500);
    } else {
      // Standard Redirect
      setTimeout(() => {
        window.location.replace(finalUrl);
      }, 800);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetLink && targetLink.password === passwordInput) {
      setIsLocked(false);
      await processRedirect(targetLink);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Unavailable</h1>
          <p className="text-stone-500 mb-6">{error}</p>
          <a href="/" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium">
            Create your own link <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-stone-200 p-8 rounded-[2rem] max-w-md w-full text-center shadow-xl shadow-stone-200/50">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Protected Link</h2>
          <p className="text-stone-500 mb-6 text-sm">Enter the password to access this content.</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              className={`w-full bg-stone-50 border ${passwordError ? 'border-red-500' : 'border-stone-200'} text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500`}
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
              autoFocus
            />
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20">
              Unlock Link
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <div className="text-center w-full max-w-md">
        <div className="w-16 h-16 bg-white border border-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Globe className="w-4 h-4 text-stone-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{redirectMsg}</h2>

        <div className="flex items-center justify-center gap-2 mb-8">
          <p className="text-stone-500 text-sm">
            Optimizing route for your device
          </p>
          {detectedLocale && (
            <span className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded border border-stone-200 font-medium">
              {detectedLocale}
            </span>
          )}
        </div>

        {destination && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white border border-stone-200 rounded-lg p-3 text-sm text-stone-400 truncate animate-pulse">
              {destination}
            </div>

            <a
              href={destination}
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-sm bg-amber-50 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Click here if you are not redirected <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirect;
