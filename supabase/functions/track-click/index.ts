// Supabase Edge Function for Click Tracking
// Deprecated in favour of /api/track (see below).

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

// Deprecated: the app now records clicks through /api/track on Vercel,
// which geolocates from Vercel's own headers. This function only serves
// browsers still running a cached copy of the old app. It used to send each
// visitor's IP to ip-api.com over plain HTTP; it no longer geolocates.

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

// The 32-bit hash above can be brute-forced back to the IP, so only an HMAC
// of it is stored -- the same value api/_lib/clickStore.ts stores.
async function hmacHex(value: string): Promise<string> {
  const secret = Deno.env.get('IP_HASH_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Keyed hash of the visitor IP, so raw addresses are never stored. Must
// match utils/ipHash.ts in the app (same normalization, HMAC-SHA256, hex)
// so clicks from both paths hash the same visitor the same way. Set
// IP_HASH_SALT in this function's secrets to the same value as in Vercel.
async function hashIP(raw: string): Promise<string | null> {
  const ip = raw.split(',')[0].trim()
  if (!ip || ip.toLowerCase() === 'unknown') return null
  const secret = Deno.env.get('IP_HASH_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ip))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
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

    console.log('Track click request:', { linkId: body.linkId })

    // Parse user agent
    const { device, os, browser } = parseUserAgent(body.userAgent || '')

    const fingerprint = await hmacHex(generateFingerprint(body, ip))

    const timestamp = new Date().toISOString()

    // Insert click event with detailed data
    const clickEventRow = {
      link_id: body.linkId,
      timestamp,
      referrer: body.referrer || 'direct',
      device,
      os,
      browser,
      country: 'Unknown',
      screen_width: body.screenWidth,
      screen_height: body.screenHeight,
      color_depth: body.colorDepth,
      timezone: body.timezone,
      language: body.language,
      platform: body.platform,
      cookies_enabled: body.cookiesEnabled,
      do_not_track: body.doNotTrack,
      fingerprint,
      ip_hash: await hashIP(ip),
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
      JSON.stringify({ success: true }),
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
