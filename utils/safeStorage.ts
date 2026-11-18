/**
 * localStorage / sessionStorage that never throw. Some in-app browsers and
 * privacy modes deny storage outright: even reading `window.localStorage`
 * throws a SecurityError. Code that runs on every page (the redirect page
 * included) must use these, so a blocked store can't take the page down.
 */
type Kind = 'local' | 'session';

function store(kind: Kind): Storage | null {
    try {
        return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
        return null;
    }
}

export function storageGet(key: string, kind: Kind = 'local'): string | null {
    try { return store(kind)?.getItem(key) ?? null; } catch { return null; }
}

export function storageSet(key: string, value: string, kind: Kind = 'local'): void {
    try { store(kind)?.setItem(key, value); } catch { /* blocked or full */ }
}

export function storageRemove(key: string, kind: Kind = 'local'): void {
    try { store(kind)?.removeItem(key); } catch { /* blocked */ }
}
