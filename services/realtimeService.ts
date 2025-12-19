/**
 * Supabase Realtime Service
 * Provides real-time subscriptions for click events and link updates
 */

import { supabase, TABLES, isSupabaseConfigured } from './storage/supabaseClient';
import { ClickEvent } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeClickEvent {
  linkId: string;
  click: ClickEvent;
}

export interface RealtimeLinkUpdate {
  linkId: string;
  clicks: number;
  lastClickedAt: number;
}

type ClickEventCallback = (event: RealtimeClickEvent) => void;
type LinkUpdateCallback = (update: RealtimeLinkUpdate) => void;

let clickEventsChannel: RealtimeChannel | null = null;
let linksChannel: RealtimeChannel | null = null;

const clickEventCallbacks: Set<ClickEventCallback> = new Set();
const linkUpdateCallbacks: Set<LinkUpdateCallback> = new Set();

/**
 * Convert database row to ClickEvent
 */
function rowToClickEvent(row: Record<string, unknown>): ClickEvent {
  return {
    timestamp: new Date(row.timestamp as string).getTime(),
    referrer: (row.referrer as string) || 'direct',
    device: (row.device as any) || 'unknown',
    os: (row.os as any) || 'unknown',
    country: row.country as string | undefined,
    browser: row.browser as string | undefined,
    countryCode: row.country_code as string | undefined,
    region: row.region as string | undefined,
    city: row.city as string | undefined,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    isp: row.isp as string | undefined,
    screenWidth: row.screen_width as number | undefined,
    screenHeight: row.screen_height as number | undefined,
    timezone: row.timezone as string | undefined,
    language: row.language as string | undefined,
    fingerprint: row.fingerprint as string | undefined,
  };
}

/**
 * Subscribe to real-time click events
 */
export function subscribeToClickEvents(callback: ClickEventCallback): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[Realtime] Supabase not configured, skipping subscription');
    return () => { };
  }

  clickEventCallbacks.add(callback);

  // Create channel if not exists
  if (!clickEventsChannel) {


    clickEventsChannel = supabase
      .channel('click_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.CLICK_EVENTS,
        },
        (payload) => {

          const row = payload.new as Record<string, unknown>;
          const clickEvent: RealtimeClickEvent = {
            linkId: row.link_id as string,
            click: rowToClickEvent(row),
          };

          // Notify all callbacks
          clickEventCallbacks.forEach(cb => cb(clickEvent));
        }
      )
      .subscribe((status) => {

      });
  }

  // Return unsubscribe function
  return () => {
    clickEventCallbacks.delete(callback);

    // If no more callbacks, unsubscribe from channel
    if (clickEventCallbacks.size === 0 && clickEventsChannel) {

      supabase?.removeChannel(clickEventsChannel);
      clickEventsChannel = null;
    }
  };
}

/**
 * Subscribe to real-time link updates (click count changes)
 */
export function subscribeToLinkUpdates(callback: LinkUpdateCallback): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[Realtime] Supabase not configured, skipping subscription');
    return () => { };
  }

  linkUpdateCallbacks.add(callback);

  // Create channel if not exists
  if (!linksChannel) {


    linksChannel = supabase
      .channel('links_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.LINKS,
        },
        (payload) => {

          const row = payload.new as Record<string, unknown>;
          const update: RealtimeLinkUpdate = {
            linkId: row.id as string,
            clicks: row.clicks as number,
            lastClickedAt: row.last_clicked_at
              ? new Date(row.last_clicked_at as string).getTime()
              : Date.now(),
          };

          // Notify all callbacks
          linkUpdateCallbacks.forEach(cb => cb(update));
        }
      )
      .subscribe((status) => {

      });
  }

  // Return unsubscribe function
  return () => {
    linkUpdateCallbacks.delete(callback);

    // If no more callbacks, unsubscribe from channel
    if (linkUpdateCallbacks.size === 0 && linksChannel) {

      supabase?.removeChannel(linksChannel);
      linksChannel = null;
    }
  };
}

/**
 * Unsubscribe from all real-time channels
 */
export function unsubscribeAll(): void {
  if (supabase) {
    if (clickEventsChannel) {
      supabase.removeChannel(clickEventsChannel);
      clickEventsChannel = null;
    }
    if (linksChannel) {
      supabase.removeChannel(linksChannel);
      linksChannel = null;
    }
  }
  clickEventCallbacks.clear();
  linkUpdateCallbacks.clear();
}
