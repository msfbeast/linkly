import { createClient, navigatorLock, processLock, SupabaseClient } from '@supabase/supabase-js';

type LockFn = <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => Promise<R>;

/**
 * The auth client serialises session access with the Web Locks API. Some
 * in-app browsers expose navigator.locks but deny it ("Access to the Locks
 * API is denied in this context"), which made every request fail, including
 * the redirect page's link lookup. Fall back to an in-page lock then.
 */
export const safeLock: LockFn = async (name, acquireTimeout, fn) => {
  let started = false;
  const run = () => { started = true; return fn(); };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    try {
      return await navigatorLock(name, acquireTimeout, run);
    } catch (err) {
      if (started || (err as { name?: string } | null)?.name !== 'SecurityError') throw err;
    }
  }
  return processLock(name, acquireTimeout, run);
};

/**
 * Supabase client configuration
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if we have valid configuration
const hasValidConfig = supabaseUrl &&
  supabaseAnonKey &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

if (!hasValidConfig) {
  console.warn(
    'Supabase environment variables not configured or invalid. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

/**
 * Supabase client instance
 * Used for all database operations
 * Returns null if not properly configured
 */
export const supabase: SupabaseClient | null = hasValidConfig
  ? createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        lock: safeLock,
      },
    }
  )
  : null;

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Database table names
 */
export const TABLES = {
  LINKS: 'links',
  CLICK_EVENTS: 'click_events',
  BIO_PROFILES: 'bio_profiles',
  PRODUCTS: 'products',
  DOMAINS: 'domains',
  TAGS: 'tags',
  FOLDERS: 'folders',
  PROFILES: 'profiles',
} as const;
