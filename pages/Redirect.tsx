import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowRight, Globe, Lock } from 'lucide-react';
import { LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { isSupabaseConfigured } from '../services/storage/supabaseClient';
import { createClickEventInput, validateClickEvent } from '../services/clickTrackingService';
import { getLinkByCode as getLocalLinkByCode, incrementClicks } from '../services/storageService';

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

  useEffect(() => {
    const fetchLink = async () => {
      try {
        let link: LinkData | null | undefined = null;

        // Try Supabase first if configured, fall back to localStorage
        if (isSupabaseConfigured()) {
          link = await supabaseAdapter.getLinkByCode(code);
        } else {
          link = getLocalLinkByCode(code);
        }

        if (link) {
          setTargetLink(link);

          // 1. Check Expiration
          if (link.expirationDate && Date.now() > link.expirationDate) {
            setError("This link has expired.");
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

          // If no password, proceed
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
  const captureDeviceFingerprint = () => {
    return {
      userAgent: navigator.userAgent || '',
      referrer: document.referrer || '',
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
      colorDepth: window.screen?.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
    };
  };

  /**
   * Records a click event using the Edge Function for detailed analytics.
   * Falls back to direct Supabase insert if Edge Function is unavailable.
   * 
   * Requirements: 2.1, 2.2
   */
  const recordClick = async (link: LinkData): Promise<void> => {
    const fingerprint = captureDeviceFingerprint();

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
          ipAddress: '',
          utm_source: searchParams.get('utm_source') || undefined,
          utm_medium: searchParams.get('utm_medium') || undefined,
          utm_campaign: searchParams.get('utm_campaign') || undefined,
          utm_term: searchParams.get('utm_term') || undefined,
          utm_content: searchParams.get('utm_content') || undefined,
          trigger_source: searchParams.get('qr') === '1' ? 'qr' : 'link',
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
            ipAddress: '',
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

    // Device Check
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

    // Geo Check (Overrides Device if specific geo rule exists)
    if (link.geoRedirects) {
      const geoUrl = link.geoRedirects[userCountry.toUpperCase()];
      if (geoUrl) {
        finalUrl = geoUrl;
        setRedirectMsg(`Redirecting for ${userCountry}...`);
      }
    }

    // Append lcid for conversion tracking
    // We generate a click ID (lcid) that can be used to track conversions downstream
    // Ideally this ID matches the one in the database, but since we insert async, 
    // we generate a client-side ID for the URL parameter.
    const lcid = crypto.randomUUID();
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}lcid=${lcid}`;

    setDestination(finalUrl);

    // Record click with full metadata capture before redirect
    // This is done asynchronously but we don't wait for it to complete
    // to avoid delaying the redirect. Failures are handled gracefully.
    recordClick(link).catch(err => {
      console.error('Click recording failed:', err);
    });

    // Redirect
    setTimeout(() => {
      window.location.href = finalUrl;
    }, 1500);
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
      <div className="text-center">
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
          <div className="bg-white border border-stone-200 rounded-lg p-3 text-sm text-stone-400 max-w-md mx-auto truncate animate-pulse">
            {destination}
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirect;
