import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  PRODUCTS: 'products',
  TAGS: 'tags',
  FOLDERS: 'folders',
} as const;
