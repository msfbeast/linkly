
import { createClient } from '@supabase/supabase-js';
import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { monetizeUrl, isShortAmazonUrl, resolveShortUrlBackend } from '../../utils/affiliateUtils';

export const config = {
    runtime: 'edge',
};

// Rate limit: 60 requests per minute per API key.
// Lazily initialized so missing Redis env (tests/local dev) degrades gracefully.
let ratelimit: Ratelimit | null | undefined;
function getRatelimiter(): Ratelimit | null {
    if (ratelimit !== undefined) return ratelimit;
    try {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(60, '60 s'),
            analytics: true,
            prefix: 'ratelimit:api:v1:links',
        });
    } catch (e) {
        console.error('[API] Rate limiter unavailable (missing Redis env?):', e);
        ratelimit = null;
    }
    return ratelimit;
}

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SLUG_LENGTH = 7;
const MAX_SLUG_ATTEMPTS = 5;

/** Cryptographically random, unbiased short code */
function generateShortCode(): string {
    const bytes = new Uint8Array(SLUG_LENGTH * 2);
    crypto.getRandomValues(bytes);
    let code = '';
    for (let i = 0; i < bytes.length && code.length < SLUG_LENGTH; i++) {
        // Rejection sampling to avoid modulo bias
        if (bytes[i] < Math.floor(256 / SLUG_ALPHABET.length) * SLUG_ALPHABET.length) {
            code += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
        }
    }
    // Extremely unlikely to be short; top up deterministically from fresh randomness if so
    while (code.length < SLUG_LENGTH) {
        const extra = new Uint8Array(1);
        crypto.getRandomValues(extra);
        code += SLUG_ALPHABET[extra[0] % SLUG_ALPHABET.length];
    }
    return code;
}

export default async function handler(request: Request) {
    // 1. CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        // 2. Authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKey = authHeader.split(' ')[1];

        // Hash the key to verify against DB
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 3. Rate Limiting (keyed by API key hash so one abusive key can't affect others)
        const limiter = getRatelimiter();
        if (limiter) try {
            const { success, limit, reset, remaining } = await limiter.limit(keyHash);
            if (!success) {
                return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                    }
                });
            }
        } catch (rlError) {
            // Fail open on rate limiter infra errors, but log loudly
            console.error('[API] Rate limiter error (failing open):', rlError);
        }

        // Init Supabase with Service Role Key (Bypass RLS)
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Server misconfiguration: Missing Supabase URL or Service Key');
            return new Response(JSON.stringify({ error: 'Server Internal Error' }), { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Verify Key
        const { data: keyData, error: keyError } = await supabase
            .from('api_keys')
            .select('user_id, scopes')
            .eq('key_hash', keyHash)
            .single();

        if (keyError || !keyData) {
            return new Response(JSON.stringify({ error: 'Invalid API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Scope Enforcement
        const scopes: string[] = keyData.scopes || [];
        if (!scopes.includes('links:write')) {
            return new Response(JSON.stringify({ error: 'Insufficient scope: links:write required' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Request Validation
        const body = await request.json();
        const { url, title, tags } = body;

        if (!url || typeof url !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing required field: url' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate URL and restrict to http(s)
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url.trim());
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                throw new Error('Invalid protocol');
            }
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid URL: must be a valid http(s) URL' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let monetizedUrl = url.trim();
        try {
            // Fetch User Profile Affiliate Config
            const profileRes = await supabase
                .from('profiles')
                .select('amazon_associate_tag, flipkart_affiliate_id')
                .eq('id', keyData.user_id)
                .single();

            const profile = profileRes?.data;
            if (profile) {
                let urlToMonetize = monetizedUrl;
                if (isShortAmazonUrl(urlToMonetize)) {
                    urlToMonetize = await resolveShortUrlBackend(urlToMonetize);
                }
                const config = {
                    amazonAssociateTag: profile.amazon_associate_tag,
                    flipkartAffiliateId: profile.flipkart_affiliate_id,
                };
                monetizedUrl = monetizeUrl(urlToMonetize, config);
            }
        } catch (profileError) {
            console.warn('[API] Gracefully ignored profile lookup error:', profileError);
        }

        // 6. Create Short Link (crypto-random code with collision retry)
        let link: any = null;
        let lastError: any = null;

        for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
            const shortCode = generateShortCode();

            // Check for collision first (covers tables without a unique constraint)
            const { data: existing } = await supabase
                .from('links')
                .select('id')
                .eq('short_code', shortCode)
                .maybeSingle();

            if (existing) {
                console.warn(`[API] Slug collision on attempt ${attempt + 1}, retrying`);
                continue;
            }

            const { data: inserted, error: linkError } = await supabase
                .from('links')
                .insert({
                    user_id: keyData.user_id,
                    original_url: monetizedUrl,
                    short_code: shortCode,
                    title: title || parsedUrl.hostname,
                    tags: tags || [],
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (linkError) {
                lastError = linkError;
                // 23505 = unique_violation (race with concurrent insert) -> retry
                if ((linkError as any).code === '23505') {
                    console.warn(`[API] Unique violation on attempt ${attempt + 1}, retrying`);
                    continue;
                }
                break;
            }

            link = inserted;
            break;
        }

        if (!link) {
            console.error('Link creation error:', lastError);
            return new Response(JSON.stringify({ error: 'Failed to create link' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Sync to Vercel KV Cache
        try {
            await kv.set(`gather:link:${link.short_code}`, {
                url: link.original_url,
                id: link.id
            });
        } catch (kvError) {
            console.error('[API] Failed to sync to Vercel KV cache:', kvError);
        }

        // 7. Success Response
        return new Response(JSON.stringify({
            id: link.id,
            shortUrl: `${new URL(request.url).origin}/${link.short_code}`,
            originalUrl: link.original_url,
            createdAt: link.created_at
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
