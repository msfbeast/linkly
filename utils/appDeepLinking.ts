/**
 * Utility to convert standard web URLs to App Deep Links (Custom Schemes)
 * This helps force mobile devices to open the content in the native app.
 */

export const getAppDeepLink = (webUrl: string): string | null => {
    try {
        const url = new URL(webUrl);
        const hostname = url.hostname.replace('www.', '');
        const path = url.pathname;
        const search = url.search;

        // YouTube
        if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be') {
            // iOS/Android usually handle http links as Universal Links, but forcing scheme can help
            // youtube://watch?v=VIDEO_ID
            if (path === '/watch') {
                const v = url.searchParams.get('v');
                if (v) return `youtube://watch?v=${v}`;
            }
            if (hostname === 'youtu.be') {
                const v = path.substring(1);
                if (v) return `youtube://watch?v=${v}`;
            }
            return `youtube://${hostname}${path}${search}`;
        }

        // Instagram
        if (hostname === 'instagram.com') {
            // instagram://user?username=USERNAME
            // instagram://media?id=MEDIA_ID (Hard to get ID from shortcode without API)
            // Fallback to generic scheme which might open app
            if (path.startsWith('/p/') || path.startsWith('/reel/')) {
                // For posts/reels, it's hard to map directly without media ID, 
                // but we can try opening the https link with a user interaction which usually triggers Universal Link.
                // However, instagram://camera is a valid scheme.
                // Let's return null for posts to rely on Universal Links, 
                // or try to use the web URL with a scheme if supported? 
                // Instagram doesn't support instagram://url=...
                return null;
            }
            // Profile
            const match = path.match(/^\/([a-zA-Z0-9_.]+)\/?$/);
            if (match && match[1] && !['p', 'reel', 'stories', 'explore'].includes(match[1])) {
                return `instagram://user?username=${match[1]}`;
            }
        }

        // Twitter / X
        if (hostname === 'twitter.com' || hostname === 'x.com') {
            // twitter://user?screen_name=USERNAME
            // twitter://status?id=TWEET_ID
            if (path.includes('/status/')) {
                const match = path.match(/\/status\/(\d+)/);
                if (match && match[1]) {
                    return `twitter://status?id=${match[1]}`;
                }
            }
            const match = path.match(/^\/([a-zA-Z0-9_]+)\/?$/);
            if (match && match[1]) {
                return `twitter://user?screen_name=${match[1]}`;
            }
        }

        // LinkedIn
        if (hostname === 'linkedin.com') {
            // linkedin://profile/ID
            // linkedin://company/ID
            // Hard to map vanity URLs to IDs without API.
            return null;
        }

        // Facebook
        if (hostname === 'facebook.com') {
            // fb://profile/ID
            // fb://page/ID
            // Hard to map vanity URLs.
            return null;
        }

        // Spotify
        if (hostname === 'open.spotify.com') {
            // spotify:track:ID
            // spotify:album:ID
            // spotify:playlist:ID
            const parts = path.split('/').filter(Boolean);
            if (parts.length >= 2) {
                const type = parts[0]; // track, album, artist, playlist
                const id = parts[1];
                return `spotify:${type}:${id}`;
            }
        }

        // Telegram
        if (hostname === 't.me') {
            const username = path.substring(1);
            return `tg://resolve?domain=${username}`;
        }

        // WhatsApp
        if (hostname === 'wa.me' || hostname === 'api.whatsapp.com') {
            // whatsapp://send?phone=...
            return `whatsapp://send?text=${encodeURIComponent(webUrl)}`;
        }

        // Flipkart
        if (hostname.includes('flipkart.com')) {
            // Try 1: Direct Product ID (Standard Scheme)
            let pid = url.searchParams.get('pid');

            // Try 2: Extract PID from path (e.g. /product-name/p/itm...)
            if (!pid) {
                const match = path.match(/\/p\/([a-zA-Z0-9]+)/);
                if (match && match[1]) {
                    pid = match[1];
                }
            }

            if (pid) {
                // flipkart://product?pid= is the most reliable scheme
                return `flipkart://product?pid=${pid}&ot=SCH&otr=TRACKER`;
            }

            // Try 3: Universal Link style (often more reliable than dl/url)
            // But usually needs `flipkart://dl/name?pid=...` logic
            // Fallback to simply opening the web URL if we can't find PID
            return `flipkart://dl/url?url=${encodeURIComponent(webUrl)}`;
        }

        // Amazon
        if (hostname.includes('amazon.com') || hostname.includes('amazon.in')) {
            // Try 1: Extract ASIN for direct product deep link
            // Patterns: /dp/ASIN, /gp/product/ASIN
            const asinMatch = path.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
            if (asinMatch && asinMatch[1]) {
                const domain = hostname.includes('amazon.in') ? 'in' : 'com';
                return `com.amazon.mobile.shopping://www.amazon.${domain}/products/${asinMatch[1]}`;
            }

            // Try 2: Universal Intent (Works well on Android)
            return `com.amazon.mobile.shopping.web://content/view?currentUrl=${encodeURIComponent(webUrl)}`;
        }

        return null;
    } catch (e) {
        console.error('Error parsing URL for deep link:', e);
        return null;
    }
};
