/**
 * Grouping key and cleanup for reported errors, shared by the browser
 * reporter and the server (api/client-error.ts).
 */

/** Errors that aren't ours or can't be acted on. */
const IGNORED = [
    /ResizeObserver loop/i,
    /^Script error\.?$/i, // cross-origin script, no details
    /Non-Error promise rejection captured/i,
    /AbortError|The user aborted a request|signal is aborted/i,
    /\bLoad failed\b/i, // Safari: fetch cancelled by navigation
    /chrome-extension:\/\/|moz-extension:\/\/|safari-extension:\/\//i,
];

export function isIgnoredError(message: string, stack?: string | null): boolean {
    return IGNORED.some(re => re.test(message.trim()) || (!!stack && re.test(stack)));
}

/** The path only: no host, query string or fragment (they can hold personal data). */
export function cleanPath(raw: string | null | undefined): string {
    if (!raw) return '';
    try {
        return new URL(raw, 'https://x.invalid').pathname.slice(0, 300);
    } catch {
        return String(raw).split(/[?#]/)[0].slice(0, 300);
    }
}

/**
 * The same error from different places in the code is different; the same
 * error with different numbers, ids or bundle hashes in it is the same.
 */
export function normaliseForGrouping(message: string, stack?: string | null): string {
    const firstFrame = (stack ?? '')
        .split('\n')
        .map(l => l.trim())
        .find(l => /^at |@/.test(l)) ?? '';
    return `${message}|${firstFrame}`
        .replace(/https?:\/\/[^\s)]+?\/(assets\/)?/g, '')          // origins and asset dirs
        .replace(/-[A-Za-z0-9_-]{8}\.js/g, '.js')                  // vite bundle hashes
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
        .replace(/\b\d+\b/g, '<n>')
        .slice(0, 2000);
}

/** SHA-256 hex (first 32 chars) of the grouping text. */
export async function errorFingerprint(source: string, message: string, stack?: string | null): Promise<string> {
    const data = new TextEncoder().encode(`${source}|${normaliseForGrouping(message, stack)}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
