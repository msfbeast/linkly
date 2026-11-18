import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ArrowRight, Globe, Lock, ArrowLeft, Download, Maximize2, ChevronLeft, ChevronRight, Sparkles, Info, ExternalLink, Zap, Camera, Sliders, ShieldCheck, Share2, Eye, Compass, ShoppingBag } from 'lucide-react';
import { LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { isSupabaseConfigured } from '../services/storage/supabaseClient';
import { getLinkByCode as getLocalLinkByCode, incrementClicks } from '../services/storageService';
import { safeNavigationUrl, safeWebUrl } from '../utils/safeUrl';
import { getAppDeepLink } from '../utils/appDeepLinking';
import { detectDeviceModel } from '../services/userAgentParser';

import { useParams } from 'react-router-dom';
import PublicCard from '../components/PublicCard';

interface RedirectProps {
  code?: string;
}

const Redirect: React.FC<RedirectProps> = ({ code: propCode }) => {
  const { code: paramCode } = useParams<{ code: string }>();
  const code = propCode || paramCode || '';

  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [redirectMsg, setRedirectMsg] = useState('Opening link…');
  const [detectedLocale, setDetectedLocale] = useState<string>('');

  // Password State
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<false | 'wrong' | 'limited'>(false);
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

          // 0. Taken down after a report
          if (link.disabledAt) {
            setError("This link has been disabled because it was reported and may lead to a harmful or misleading page.");
            return;
          }

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
              setError("This link is part of a page and can't be opened on its own.");
              return;
            }
          }

          // If no password and valid type, proceed
          if (link.type === 'gallery') {
            return;
          }
          await processRedirect(link);
        } else {
          setError("There's no link at this address. Check it for typos.");
        }
      } catch (err) {
        console.error('Error fetching link:', err);
        setError("Something went wrong loading this link. Try again in a moment.");
      }
    };

    fetchLink();
  }, [code]);

  /**
   * Browser details for analytics. The IP, location and visitor IDs are
   * worked out server-side by /api/track from the request itself.
   */
  const captureDeviceFingerprint = () => {
    const ua = navigator.userAgent || '';
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
      deviceModel: detectDeviceModel(ua), // Detailed device model (e.g. iPhone 15)
    };
  };

  /**
   * Records a click through /api/track (same origin), retrying once.
   * Clicks are only ever written server-side: the database no longer
   * accepts click rows from browsers, which let anyone inflate counts.
   * If both attempts fail the click goes uncounted; the redirect is
   * never held up.
   */
  const recordClick = async (link: LinkData, destinationUrl?: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      incrementClicks(link.id); // local-only mode (no backend)
      return;
    }
    // Same id on both attempts. On phones the redirect right after this
    // often makes the first (keepalive) request look failed although it
    // reached the server; the retry then counted the click a second time
    // (~1 in 5 mobile clicks). The server stores an id only once.
    const eventId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined;
    const body = JSON.stringify({
      linkId: link.id,
      eventId,
      destinationUrl, // Pass destination URL for A/B testing
      ...captureDeviceFingerprint(),
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body,
        });
        // 4xx (bad link id, unknown link) won't succeed on retry.
        if (response.ok || (response.status >= 400 && response.status < 500)) return;
      } catch {
        // network error: retry once
      }
    }
    console.warn('[Click Tracking] /api/track unavailable; click not recorded');
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
          setRedirectMsg("Opening link…");
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
        setRedirectMsg("Opening the app…");
      } else if (/android/i.test(ua) && link.smartRedirects.android) {
        finalUrl = link.smartRedirects.android;
        setRedirectMsg("Opening the app…");
      } else if (!/Mobile/.test(ua) && link.smartRedirects.desktop) {
        finalUrl = link.smartRedirects.desktop;
      }
    }

    // 3. Geo Check (Overrides Device if specific geo rule exists)
    if (link.geoRedirects) {
      const geoUrl = link.geoRedirects[userCountry.toUpperCase()];
      if (geoUrl) {
        finalUrl = geoUrl;
        setRedirectMsg('Opening link…');
      }
    }

    // Ensure finalUrl is valid
    if (!finalUrl || finalUrl.trim().toLowerCase().startsWith('widget://')) {
      setError("This link's destination isn't a web address that can be opened.");
      return;
    }
    // Destinations come from users (link, A/B variants, device and geo
    // rules). Refuse script-capable schemes before navigating: a
    // javascript: URL here would run on our origin for every visitor.
    const safeFinalUrl = safeNavigationUrl(finalUrl);
    if (!safeFinalUrl) {
      setError("This link's destination isn't a valid web address.");
      return;
    }
    finalUrl = safeFinalUrl;

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
    const deepLink = safeNavigationUrl(getAppDeepLink(finalUrl, navigator.userAgent));

    if (deepLink) {

      setRedirectMsg("Opening the app…");

      // Try to open the app
      // For Intent URIs (Android), replace() is often cleaner and matches competitor logic
      if (deepLink.startsWith('intent://')) {
        window.location.replace(deepLink);
      } else {
        window.location.href = deepLink;
      }

      // Fallback to web URL ONLY if the app didn't open.
      // If the app opens, the page is backgrounded — cancel the fallback so
      // returning users aren't redirected a second time (double-fires clicks
      // and can clobber affiliate attribution).
      const fallbackTimer = setTimeout(() => {
        window.location.replace(finalUrl);
      }, 2500);

      const cleanup = () => {
        clearTimeout(fallbackTimer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pagehide', cleanup);
        window.removeEventListener('blur', cleanup);
      };
      const onVisibilityChange = () => {
        if (document.hidden) cleanup();
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('pagehide', cleanup);
      window.addEventListener('blur', cleanup);
    } else {
      // Standard Redirect
      setTimeout(() => {
        window.location.replace(finalUrl);
      }, 800);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Checked on the server: the browser never receives the password, and
    // a protected link's destination only arrives after it matches. The
    // server stops accepting guesses after too many wrong ones.
    const result = targetLink && code && isSupabaseConfigured()
      ? await supabaseAdapter.unlockLink(code, passwordInput)
      : (targetLink && targetLink.password === passwordInput // local-only mode
        ? { status: 'ok' as const, link: targetLink }
        : { status: 'wrong' as const });
    if (result.status === 'ok') {
      const unlocked = result.link;
      setTargetLink(unlocked);
      setIsLocked(false);
      if (unlocked.type === 'gallery') {
        return;
      }
      await processRedirect(unlocked);
    } else {
      setPasswordError(result.status === 'limited' ? 'limited' : 'wrong');
      setPasswordInput('');
    }
  };

  if (error) {
    return (
      <PublicCard>
        <h1 className="text-[22px] font-medium tracking-tight">This link isn't available</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5F5C56]">{error}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <a href="/" className="inline-flex items-center gap-1.5 rounded-full bg-[#18181A] px-4 py-2 text-white hover:opacity-90">
            Make your own short link <ArrowRight className="h-4 w-4" />
          </a>
          {code && <a href={`/report?link=${encodeURIComponent(code)}`} className="text-[#8C8981] underline-offset-2 hover:text-[#18181A] hover:underline">Report this link</a>}
        </div>
      </PublicCard>
    );
  }

  if (isLocked) {
    return (
      <PublicCard>
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#18181A] text-white"><Lock className="h-4 w-4" /></span>
        <h1 className="text-[22px] font-medium tracking-tight">This link needs a password</h1>
        <p className="mt-1.5 text-[14px] text-[#8C8981]">Ask whoever shared it.</p>
        <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-3">
          <label htmlFor="link-password" className="sr-only">Password</label>
          <input
            id="link-password"
            type="password"
            autoComplete="off"
            placeholder="Password"
            aria-invalid={!!passwordError || undefined}
            className={`w-full rounded-2xl bg-[#F0EEEA] px-4 py-3.5 text-[15px] outline-none placeholder:text-[#A19E97] focus:ring-2 ${passwordError ? 'ring-2 ring-[#B42318]/40' : 'focus:ring-[#FF5A14]/30'}`}
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
            autoFocus
          />
          {passwordError && (
            <p className="text-[13px] text-[#B42318]" role="alert">
              {passwordError === 'limited' ? 'Too many wrong passwords. Try again in 15 minutes.' : 'Wrong password.'}
            </p>
          )}
          <button type="submit" disabled={!passwordInput} className="rounded-full bg-[#FF5A14] py-3.5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50">
            Open link
          </button>
        </form>
      </PublicCard>
    );
  }

  if (targetLink && !isLocked && !error && targetLink.type === 'gallery') {
    return (
      <GalleryView link={targetLink} recordClick={recordClick} />
    );
  }

  return (
    <PublicCard>
      <div className="flex items-center gap-3" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-[#FF5A14]" />
        <h1 className="text-[18px] font-medium">{redirectMsg}</h1>
        {detectedLocale && <span className="rounded-md bg-[#F0EEEA] px-2 py-0.5 font-mono text-[11px] text-[#8C8981]">{detectedLocale}</span>}
      </div>
      {destination && (
        <div className="mt-5">
          <p className="truncate rounded-xl bg-[#F0EEEA] px-3 py-2 font-mono text-[12px] text-[#8C8981]">{destination}</p>
          <a href={destination} rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#18181A] underline underline-offset-2">
            Not moving? Open it yourself <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </PublicCard>
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
    const url = safeWebUrl(link.originalUrl);
    if (url) window.open(url, "_blank", "noopener");
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

        </div>
      </main>
    </div>
  );
};

export default Redirect;
