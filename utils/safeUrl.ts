/**
 * Guards for URLs that came from users (link destinations, A/B variants,
 * device and geo redirects, product links) before the app navigates to them.
 *
 * React 19 already neutralises `javascript:` in href/src attributes, but not
 * in `window.location` or `window.open`, which run the URL as script on our
 * origin. That would hand the visitor's Supabase session (kept in
 * localStorage) to whoever wrote the URL.
 *
 * URLs are parsed with the same WHATWG parser the browser uses for
 * navigation, so tricks like "java\tscript:" or leading control characters
 * are normalised before the scheme is checked, and the returned href is
 * exactly what the browser will see.
 */

/** Schemes that can run script or read local data when navigated to. */
const DANGEROUS_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'filesystem:', 'about:']);

function parse(raw: unknown): URL | null {
    if (typeof raw !== 'string') return null;
    const s = raw.trim();
    if (!s) return null;
    try {
        return new URL(s);
    } catch { /* not a full URL; see below */ }
    // A title pasted with the address ("Folo – https://play.google.com/..."):
    // use the address.
    const embedded = /https?:\/\/[^\s<>"']+/i.exec(s);
    if (embedded) {
        try { return new URL(embedded[0]); } catch { return null; }
    }
    // Saved without a scheme ("example.com/page"): treat as https, as the
    // link creation form does. Not when it reads as user@host (an email
    // address typed by mistake), and not when it has spaces.
    if (/\s/.test(s)) return null;
    try {
        const u = new URL(`https://${s}`);
        return u.username || u.password || !u.hostname.includes('.') ? null : u;
    } catch {
        return null;
    }
}

/** An http(s) URL, or null. For pages that only ever open web links. */
export function safeWebUrl(raw: unknown): string | null {
    const u = parse(raw);
    return u && (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
}

/**
 * Any URL except script-capable schemes, or null. For destinations that may
 * legitimately be app links (instagram://..., intent://...).
 */
export function safeNavigationUrl(raw: unknown): string | null {
    const u = parse(raw);
    return u && !DANGEROUS_SCHEMES.has(u.protocol) ? u.href : null;
}
