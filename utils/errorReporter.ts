import { cleanPath, isIgnoredError } from './errorFingerprint';

/**
 * Sends browser errors to /api/client-error (stored in public.error_log,
 * shown in the admin dashboard). At most MAX_PER_PAGE reports per page
 * load and one per distinct message, so a render loop can't flood it.
 */
const MAX_PER_PAGE = 10;
const sent = new Set<string>();
let installed = false;

declare const __APP_RELEASE__: string | undefined;
const release = typeof __APP_RELEASE__ === 'string' ? __APP_RELEASE__ : '';

export function reportError(error: unknown, extra?: { componentStack?: string | null }): void {
    try {
        const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
        const message = (err.message || String(error)).slice(0, 1000);
        const stack = [err.stack, extra?.componentStack].filter(Boolean).join('\n--- component stack ---\n').slice(0, 4000);
        if (!message || isIgnoredError(message, stack)) return;
        const key = message.slice(0, 200);
        if (sent.has(key) || sent.size >= MAX_PER_PAGE) return;
        sent.add(key);
        if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') return;
        const body = JSON.stringify({ message, stack, path: cleanPath(window.location.href), release });
        if (navigator.sendBeacon?.('/api/client-error', new Blob([body], { type: 'application/json' }))) return;
        fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch { /* never let reporting break the page */ }
}

/** Listen for uncaught errors and unhandled promise rejections. Call once at startup. */
export function installErrorReporter(): void {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    window.addEventListener('error', e => {
        // Resource load errors (img/script) have no .error; skip them.
        if (e.error || e.message) reportError(e.error ?? e.message);
    });
    window.addEventListener('unhandledrejection', e => reportError(e.reason));
}

/** For tests. */
export function resetErrorReporterForTests(): void {
    sent.clear();
}
