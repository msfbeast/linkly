import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowRight, Globe, Lock } from 'lucide-react';
import { LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { isSupabaseConfigured } from '../services/storage/supabaseClient';
import { createClickEventInput, validateClickEvent } from '../services/clickTrackingService';
import { getLinkByCode as getLocalLinkByCode, incrementClicks } from '../services/storageService';

interface RedirectProps {
  code: string;
}

const Redirect: React.FC<RedirectProps> = ({ code }) => {
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
   * Captures request metadata for click tracking.
   * Note: IP address cannot be obtained client-side, so we pass empty string.
   * The geolocation service will return "Unknown" per Requirements 2.5.
   */
  const captureRequestMetadata = () => {
    return {
      userAgent: navigator.userAgent || '',
      referrer: document.referrer || '',
      // IP address is not available client-side - would need server-side tracking
      // The geolocation service handles this gracefully by returning "Unknown"
      ipAddress: '',
    };
  };

  /**
   * Records a click event using the storage adapter.
   * Handles failures gracefully - the redirect will still proceed.
   * 
   * Requirements: 2.1, 2.2
   */
  const recordClick = async (link: LinkData): Promise<void> => {
    const metadata = captureRequestMetadata();
    const timestamp = Date.now();
    
    // Create click event input
    const clickEventInput = createClickEventInput(metadata, timestamp);
    
    // Validate the click event (log warnings but don't block)
    const validation = validateClickEvent(link.id, clickEventInput);
    if (!validation.valid) {
      console.warn('Click event validation warnings:', validation.errors);
    }
    
    try {
      if (isSupabaseConfigured()) {
        // Use Supabase adapter for production tracking
        await supabaseAdapter.recordClick(link.id, clickEventInput);
      } else {
        // Fall back to localStorage for local development
        incrementClicks(link.id);
      }
    } catch (recordError) {
      // Log error but don't fail the redirect - graceful degradation
      // Requirements: Handle tracking failures gracefully (still redirect)
      console.error('Failed to record click:', recordError);
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Unavailable</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <a href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium">
            Create your own link <ArrowRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Protected Link</h2>
          <p className="text-slate-400 mb-6 text-sm">Enter the password to access this content.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder="Password" 
              className={`w-full bg-slate-950 border ${passwordError ? 'border-red-500' : 'border-slate-700'} text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
              autoFocus
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
              Unlock Link
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Globe className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{redirectMsg}</h2>
        
        <div className="flex items-center justify-center gap-2 mb-8">
          <p className="text-slate-400 text-sm">
            Optimizing route for your device
          </p>
          {detectedLocale && (
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-700">
              {detectedLocale}
            </span>
          )}
        </div>
        
        {destination && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-500 max-w-md mx-auto truncate animate-pulse">
            {destination}
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirect;
