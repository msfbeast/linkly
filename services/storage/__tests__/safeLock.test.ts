import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeLock } from '../supabaseClient';

const denied = () => { throw new DOMException('Access to the Locks API is denied in this context.', 'SecurityError'); };

describe('safeLock', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'locks');
    afterEach(() => {
        if (original) Object.defineProperty(navigator, 'locks', original);
        else delete (navigator as unknown as Record<string, unknown>).locks;
    });

    it('runs the work when the browser denies the Locks API', async () => {
        Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: denied } });
        await expect(safeLock('lock:auth', 100, async () => 'ok')).resolves.toBe('ok');
    });

    it('runs the work when there is no Locks API', async () => {
        Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
        await expect(safeLock('lock:auth', 100, async () => 'ok')).resolves.toBe('ok');
    });

    it('passes on errors from the work itself, without running it twice', async () => {
        Object.defineProperty(navigator, 'locks', {
            configurable: true,
            value: { request: (_n: string, _o: unknown, cb: () => Promise<unknown>) => cb() },
        });
        const work = vi.fn(async () => { throw new DOMException('denied inside', 'SecurityError'); });
        await expect(safeLock('lock:auth', 100, work)).rejects.toThrow('denied inside');
        expect(work).toHaveBeenCalledTimes(1);
    });
});
