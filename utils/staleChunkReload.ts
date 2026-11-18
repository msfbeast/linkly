/**
 * After a deploy, a page opened on the previous build asks for code chunks
 * that no longer exist ("Failed to fetch dynamically imported module").
 * Reload once to pick up the new build; the timestamp stops a reload loop
 * if the chunk is missing for some other reason.
 */
const KEY = 'gather_chunk_reload_at';
const WINDOW_MS = 60_000;

export function isStaleChunkError(message: string): boolean {
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \S+ failed/i.test(message);
}

/** Reloads the page unless it already did so within the last minute. Returns whether it reloaded. */
export function reloadForStaleChunk(now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeSession(), reload = () => window.location.reload()): boolean {
    try {
        const last = Number(storage?.getItem(KEY) || 0);
        if (now - last < WINDOW_MS) return false;
        storage?.setItem(KEY, String(now));
    } catch { /* storage blocked: still reload once per page load */ }
    reload();
    return true;
}

function safeSession(): Storage | null {
    try { return window.sessionStorage; } catch { return null; }
}

/** Vite fires vite:preloadError when a lazy chunk fails to load. */
export function installStaleChunkReload(): void {
    window.addEventListener('vite:preloadError', (event) => {
        if (reloadForStaleChunk()) event.preventDefault();
    });
}
