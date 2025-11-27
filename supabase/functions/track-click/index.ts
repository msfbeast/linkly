// Supabase Edge Function for Click Tracking
// This runs server-side and has access to visitor IP for geolocation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClickRequest {
  linkId: string
  shortCode: string
  userAgent: string
  referrer: string
  screenWidth?: number
  screenHeight?: number
  colorDepth?: number
  timezone?: string
  language?: string
  platform?: string
  cookiesEnabled?: boolean
  doNotTrack?: boolean
}

interface GeoData {
  country: string
  countryCode: string
  region: string
  city: string
  latitude?: number
  longitude?: number
  isp?: string
}

// Parse user agent for device and OS
function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  const uaLower = ua.toLowerCase()
  
  // Detect device
  let device = 'Desktop'
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) {
      device = 'Tablet'
    } else {
      device = 'Mobile'
    }
  }
  
  // Detect OS
  let os = 'Unknown'
  if (/windows nt 10/i.test(ua)) os = 'Windows 10'
  else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1'
  else if (/windows nt 6.2/i.test(ua)) os = 'Windows 8'
  else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7'
  else if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac os x/i.test(ua)) os = 'MacOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  else if (/cros/i.test(ua)) os = 'ChromeOS'
  
  // Detect browser
  let browser = 'Unknown'
  if (/edg/i.test(ua)) browser = 'Edge'
  else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/opera|opr/i.test(ua)) browser = 'Opera'
  else if (/msie|trident/i.test(ua)) browser = 'IE'
  
  return { device, os, browser }
}

// Get geolocation from IP using free API
async function getGeoFromIP(ip: string): Promise<GeoData> {
  try {
    // Skip localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        countryCode: 'XX',
        region: 'Local',
        city: 'Local',
      }
    }
    
    // Use ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,isp`)
    
    if (!response.ok) {
      throw new Error('Geo API failed')
    }
    
    const data = await response.json()
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        region: data.regionName || data.region || 'Unknown',
        city: data.city || 'Unknown',
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
      }
    }
    
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
    }
  } catch (error) {
    console.error('Geo lookup failed:', error)
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
    }
  }
}

// Generate a simple fingerprint hash from device characteristics
function generateFingerprint(data: ClickRequest, ip: string): string {
  const components = [
    data.userAgent,
    data.screenWidth,
    data.screenHeight,
    data.colorDepth,
    data.timezone,
    data.language,
    data.platform,
    ip,
  ].filter(Boolean).join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

// Hash IP for privacy
function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get visitor IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'Unknown'
    
    const body: ClickRequest = await req.json()
    
    console.log('Track click request:', { linkId: body.linkId, ip })
    
    // Parse user agent
    const { device, os, browser } = parseUserAgent(body.userAgent || '')
    
    // Get geolocation
    const geo = await getGeoFromIP(ip)
    
    // Generate fingerprint
    const fingerprint = generateFingerprint(body, ip)
    
    const timestamp = new Date().toISOString()
    
    // Insert click event with detailed data
    const clickEventRow = {
      link_id: body.linkId,
      timestamp,
      referrer: body.referrer || 'direct',
      device,
      os,
      browser,
      country: geo.country,
      country_code: geo.countryCode,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      screen_width: body.screenWidth,
      screen_height: body.screenHeight,
      color_depth: body.colorDepth,
      timezone: body.timezone,
      language: body.language,
      platform: body.platform,
      cookies_enabled: body.cookiesEnabled,
      do_not_track: body.doNotTrack,
      fingerprint,
      ip_hash: hashIP(ip),
      raw_user_agent: body.userAgent,
    }
    
    const { error: clickError } = await supabase
      .from('click_events')
      .insert(clickEventRow)
    
    if (clickError) {
      console.error('Failed to insert click:', clickError)
      throw new Error(`Failed to record click: ${clickError.message}`)
    }
    
    // Update link click count
    const { error: updateError } = await supabase.rpc('increment_link_clicks', {
      link_id: body.linkId,
      clicked_at: timestamp,
    })
    
    if (updateError) {
      // Fallback to manual update
      const { data: link } = await supabase
        .from('links')
        .select('clicks')
        .eq('id', body.linkId)
        .single()
      
      if (link) {
        await supabase
          .from('links')
          .update({
            clicks: (link.clicks || 0) + 1,
            last_clicked_at: timestamp,
          })
          .eq('id', body.linkId)
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, fingerprint }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Track click error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
