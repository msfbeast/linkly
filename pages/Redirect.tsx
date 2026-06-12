import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ArrowRight, Globe, Lock, ArrowLeft, Download, Maximize2, ChevronLeft, ChevronRight, Sparkles, Info, ExternalLink, Zap, Camera, Sliders, ShieldCheck, Share2, Eye, Compass, ShoppingBag } from 'lucide-react';
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
          if (link.type === 'gallery') {
            return;
          }
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





    try {
      // Try Edge Function first for detailed analytics with IP geolocation
      const edgeFunctionUrl = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1/track-click');

      if (edgeFunctionUrl && isSupabaseConfigured()) {


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

          return;
        } else {
          console.warn('[Click Tracking] Edge Function failed, falling back to direct insert');
        }
      }

      // Fallback to direct Supabase insert
      if (isSupabaseConfigured()) {


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

        await supabaseAdapter.recordClick(link.id, { ...clickEventInput, country: 'Unknown', device: clickEventInput.device as any, os: clickEventInput.os as any });

      } else {

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
          await supabaseAdapter.recordClick(link.id, { ...clickEventInput, country: 'Unknown', device: clickEventInput.device as any, os: clickEventInput.os as any });
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
      if (targetLink.type === 'gallery') {
        return;
      }
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

  if (targetLink && !isLocked && !error && targetLink.type === 'gallery') {
    return (
      <GalleryView link={targetLink} recordClick={recordClick} />
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

interface GalleryViewProps {
  link: LinkData;
  recordClick: (link: LinkData, destinationUrl?: string) => Promise<void>;
}

const GalleryView: React.FC<GalleryViewProps> = ({ link, recordClick }) => {
  const metadata = link.metadata || {};
  const galleryItems = metadata.galleryItems || [];
  const beforeAfter = metadata.beforeAfter || { beforeUrl: '', afterUrl: '', beforeLabel: 'Standard HDR', afterLabel: 'Raw Recovery' };
  const creatorProduct = metadata.creatorProduct || { title: '', description: '', price: '', buttonText: 'Get Preset Pack', buttonUrl: '', imageUrl: '' };
  const sponsor = metadata.sponsor || { title: '', description: '', buttonText: 'Buy Now', buttonUrl: '' };

  const [activeIndex, setActiveIndex] = useState(0);
  const [showExif, setShowExif] = useState(true);
  const [countdown, setCountdown] = useState(8);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Before/After Slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const isResizingRef = useRef(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsUnlocked(true);
    }
  }, [countdown]);

  const handleDownloadDrive = async () => {
    setIsRedirecting(true);
    await recordClick(link, link.originalUrl);
    window.open(link.originalUrl, "_blank");
    setIsRedirecting(false);
  };

  const handlePrev = () => {
    if (galleryItems.length === 0) return;
    setActiveIndex(prev => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (galleryItems.length === 0) return;
    setActiveIndex(prev => (prev === galleryItems.length - 1 ? 0 : prev + 1));
  };

  const handleMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 || isResizingRef.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans antialiased relative overflow-x-hidden selection:bg-yellow-200">
      {/* Background Blob Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-yellow-200/20 via-purple-200/10 to-transparent blur-3xl -z-10 rounded-full opacity-60 pointer-events-none" />

      {/* Sticky Countdown Header Bar */}
      <div className="sticky top-0 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200/60 z-50 px-6 py-3.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight text-slate-900">{link.domain || 'links.trak.in'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-stone-500 hidden sm:inline">
            {!isUnlocked ? `Unlocking original files in ${countdown}s...` : "Files unlocked and ready!"}
          </span>
          <button
            onClick={handleDownloadDrive}
            disabled={!isUnlocked || isRedirecting}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              isUnlocked 
                ? 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02] shadow-slate-950/10' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isRedirecting ? (
              <span>Connecting...</span>
            ) : !isUnlocked ? (
              <span>Locked ({countdown}s)</span>
            ) : (
              <>
                <span>Get RAW Files</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Area: Gallery Slideshow & Details (Col Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400/20 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Camera Samples
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                <Eye className="w-3.5 h-3.5" /> {link.clicks} views
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {link.title || 'Camera Sample Gallery'}
            </h1>
            {link.description && (
              <p className="text-stone-500 text-sm leading-relaxed">
                {link.description}
              </p>
            )}
          </div>

          {/* Main Slideshow Container */}
          {galleryItems.length > 0 ? (
            <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 bg-white aspect-video shadow-xl shadow-stone-100/40 group">
              
              {/* Slideshow controls */}
              {galleryItems.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-900 rounded-full z-20 backdrop-blur-md border border-stone-200/50 shadow-md transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white text-slate-900 rounded-full z-20 backdrop-blur-md border border-stone-200/50 shadow-md transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Frame */}
              <div className="w-full h-full flex items-center justify-center relative bg-stone-50">
                <img 
                  src={galleryItems[activeIndex].url} 
                  alt={galleryItems[activeIndex].title || 'Gallery sample'}
                  className="w-full h-full object-contain transition-all duration-300"
                />
                
                {/* Category overlay */}
                {galleryItems[activeIndex].category && (
                  <span className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                    {galleryItems[activeIndex].category}
                  </span>
                )}

                {/* Info overlay toggle */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setShowExif(!showExif)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${showExif ? 'bg-yellow-400 border-yellow-400 text-slate-900 font-extrabold' : 'bg-white border-stone-200 text-stone-500 hover:text-slate-900'}`}
                    title="Toggle Camera Info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* EXIF Data Panel Overlay */}
              {showExif && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200/60 text-xs grid grid-cols-2 md:grid-cols-5 gap-3 text-stone-600 shadow-xl shadow-stone-900/5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Camera</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                      <Camera className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      {galleryItems[activeIndex].camera || 'Unknown Model'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Sensor/Lens</span>
                    <span className="font-bold text-slate-900 truncate block">{galleryItems[activeIndex].sensor || 'Standard'}</span>
                  </div>
                  <div className="space-y-0.5 text-right md:text-left">
                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Aperture</span>
                    <span className="font-bold text-slate-900 font-mono">{galleryItems[activeIndex].aperture || 'f/1.8'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Exposure</span>
                    <span className="font-bold text-slate-900 font-mono">{galleryItems[activeIndex].shutter || '1/120s'} @ ISO {galleryItems[activeIndex].iso || '100'}</span>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] text-stone-400 uppercase font-bold block">Size</span>
                    <span className="font-bold text-orange-600 font-mono">{galleryItems[activeIndex].size || 'Original'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-stone-200 text-stone-400">
              No photos uploaded to this gallery.
            </div>
          )}

          {/* Thumbnail Selector Bar */}
          {galleryItems.length > 1 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {galleryItems.map((sample: any, idx: number) => (
                <button
                  key={sample.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-[1.2rem] overflow-hidden aspect-video border-2 bg-stone-100 transition-all ${idx === activeIndex ? 'border-yellow-400 scale-[1.02] shadow-md shadow-stone-200' : 'border-stone-200 opacity-60 hover:opacity-100'}`}
                >
                  <img src={sample.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Interactive Before/After Camera Comparison Slider */}
          {beforeAfter && beforeAfter.beforeUrl && beforeAfter.afterUrl && (
            <div className="bg-white border border-stone-200 rounded-[2rem] p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-yellow-500" />
                    Dynamic Performance Slider
                  </h3>
                  <p className="text-xs text-stone-500">Drag the handle to compare standard HDR processing vs Raw recovery.</p>
                </div>
                <span className="bg-yellow-400/20 text-yellow-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border border-yellow-400/30">
                  Raw Compare
                </span>
              </div>

              {/* Slider frame */}
              <div 
                ref={sliderContainerRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseDown={() => { isResizingRef.current = true; }}
                onMouseUp={() => { isResizingRef.current = false; }}
                onMouseLeave={() => { isResizingRef.current = false; }}
                className="relative w-full aspect-video rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 cursor-ew-resize select-none shadow-inner"
              >
                {/* Standard HDR (Right / Background) */}
                <img 
                  src={beforeAfter.afterUrl} 
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md shadow-sm">
                  {beforeAfter.afterLabel || 'Raw Recovery'}
                </div>

                {/* Raw recovery (Left / Overlay) */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={beforeAfter.beforeUrl} 
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: sliderContainerRef.current?.getBoundingClientRect().width }}
                  />
                  <div className="absolute bottom-4 left-4 bg-yellow-400 text-slate-900 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md font-bold shadow-sm">
                    {beforeAfter.beforeLabel || 'Standard HDR'}
                  </div>
                </div>

                {/* Slider Handle Line */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-yellow-400 pointer-events-none shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 text-slate-950 rounded-full flex items-center justify-center border-4 border-[#FDFBF7] font-bold text-xs select-none shadow-md">
                    ↔
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Premium Store Promotion & Info (Col Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Native Sponsor Banner (Monetization Slot 1) */}
          {sponsor && sponsor.title && sponsor.buttonUrl && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50/60 border border-yellow-200/50 rounded-[2rem] p-6 shadow-md shadow-yellow-100/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <span className="bg-slate-900/10 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-900/15">
                  Recommended Sponsor Deal
                </span>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{sponsor.title}</h3>
                  {sponsor.description && (
                    <p className="text-xs text-stone-500 leading-relaxed">{sponsor.description}</p>
                  )}
                </div>

                <a 
                  href={sponsor.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm text-center block transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-yellow-400" />
                  {sponsor.buttonText || 'Buy Now'}
                </a>
              </div>
            </div>
          )}

          {/* Native Product / Wallpaper Pack Ad (Monetization Slot 2) */}
          {creatorProduct && creatorProduct.title && creatorProduct.buttonUrl && (
            <div className="bg-white border border-stone-200 rounded-[2rem] p-6 shadow-md shadow-stone-100/40 relative overflow-hidden group">
              <div className="space-y-6">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block">Featured Creator Product</span>
                
                {/* Product Image preview */}
                {creatorProduct.imageUrl && (
                  <div className="aspect-video bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden relative shadow-inner">
                    <img 
                      src={creatorProduct.imageUrl} 
                      alt="Product Preview" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/5" />
                    {creatorProduct.price && (
                      <span className="absolute bottom-2 right-2 bg-yellow-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        {creatorProduct.price}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">{creatorProduct.title}</h4>
                  {creatorProduct.description && (
                    <p className="text-xs text-stone-500 leading-relaxed">{creatorProduct.description}</p>
                  )}
                </div>

                <a 
                  href={creatorProduct.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 py-3.5 rounded-xl font-bold text-sm text-center block transition-all active:scale-[0.98] shadow-lg shadow-yellow-400/10 flex items-center justify-center gap-1.5"
                >
                  <span>{creatorProduct.buttonText || 'Get Pack'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Technical Verification widget */}
          <div className="bg-white border border-stone-200 rounded-[2rem] p-6 space-y-4 shadow-sm">
            <h4 className="text-xs uppercase tracking-widest font-bold text-stone-400">File Verification</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Virustotal Clean</span>
                  <span className="text-stone-400 text-[10px]">MD5 check passed</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Uncompressed Original</span>
                  <span className="text-stone-400 text-[10px]">Zero compression. High dynamic range intact.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Redirect;
