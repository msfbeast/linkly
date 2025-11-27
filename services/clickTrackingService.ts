/**
 * Click Tracking Service
 * 
 * Handles the full click recording flow including user agent parsing,
 * geolocation lookup, validation, and deduplication.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.3, 6.4
 */

import { parseUserAgent, DeviceType, OSType } from './userAgentParser';
import { getCountryFromIP } from './geolocationService';
import { ClickEventInput } from './storage/types';
import { ClickEvent } from '../types';

/**
 * Request data for tracking a click
 */
export interface ClickRequest {
  userAgent: string;
  referrer: string;
  ipAddress: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  trigger_source?: string;
}

/**
 * Result of a redirect operation
 */
export interface RedirectResult {
  success: boolean;
  redirectUrl: string;
  error?: string;
}

/**
 * Validation result for click events
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Extended click event with linkId for deduplication
 */
export interface ClickEventWithLinkId extends ClickEvent {
  linkId: string;
}

/**
 * Validates a click event input to ensure data integrity.
 * Rejects events with missing or invalid required fields.
 * 
 * Requirements: 6.3
 * 
 * @param linkId - The ID of the link being clicked
 * @param event - The click event input to validate
 * @returns ValidationResult indicating if the event is valid
 */
export function validateClickEvent(
  linkId: string,
  event: Partial<ClickEventInput>
): ValidationResult {
  const errors: string[] = [];

  // Validate linkId
  if (!linkId || typeof linkId !== 'string' || linkId.trim() === '') {
    errors.push('linkId is required and must be a non-empty string');
  }

  // Validate timestamp
  if (event.timestamp === undefined || event.timestamp === null) {
    errors.push('timestamp is required');
  } else if (typeof event.timestamp !== 'number') {
    errors.push('timestamp must be a number');
  } else if (event.timestamp < 0) {
    errors.push('timestamp must be non-negative');
  } else if (!Number.isFinite(event.timestamp)) {
    errors.push('timestamp must be a finite number');
  }

  // Validate referrer (must be defined, can be empty string which becomes 'direct')
  if (event.referrer === undefined || event.referrer === null) {
    errors.push('referrer is required');
  } else if (typeof event.referrer !== 'string') {
    errors.push('referrer must be a string');
  }

  // userAgent and ipAddress are optional but should be strings if provided
  if (event.userAgent !== undefined && typeof event.userAgent !== 'string') {
    errors.push('userAgent must be a string');
  }

  if (event.ipAddress !== undefined && typeof event.ipAddress !== 'string') {
    errors.push('ipAddress must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Deduplicates click events based on linkId and timestamp.
 * Events with the same linkId and timestamp are considered duplicates.
 * 
 * Requirements: 6.4
 * 
 * @param events - Array of click events with linkId
 * @returns Deduplicated array of click events
 */
export function deduplicateEvents(
  events: ClickEventWithLinkId[]
): ClickEventWithLinkId[] {
  const seen = new Set<string>();
  const result: ClickEventWithLinkId[] = [];

  for (const event of events) {
    // Create a unique key from linkId and timestamp
    const key = `${event.linkId}:${event.timestamp}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(event);
    }
  }

  return result;
}

/**
 * Processes raw click request data into a complete ClickEvent.
 * Parses user agent for device/OS and looks up geolocation.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * @param request - The raw click request data
 * @param timestamp - The timestamp of the click (defaults to now)
 * @returns A complete ClickEvent with all derived fields
 */
export async function processClickRequest(
  request: ClickRequest,
  timestamp: number = Date.now()
): Promise<ClickEvent> {
  // Parse user agent for device and OS
  const { device, os } = parseUserAgent(request.userAgent || '');

  // Get country from IP (returns "Unknown" on failure per Requirements 2.5)
  const country = await getCountryFromIP(request.ipAddress || '');

  // Normalize referrer - empty becomes 'direct'
  const referrer = request.referrer || 'direct';

  return {
    timestamp,
    referrer,
    device,
    os,
    country,
  };
}

/**
 * Creates a ClickEventInput from a ClickRequest for storage.
 * 
 * @param request - The raw click request data
 * @param timestamp - The timestamp of the click (defaults to now)
 * @returns A ClickEventInput ready for storage
 */
export function createClickEventInput(
  request: ClickRequest,
  timestamp: number = Date.now()
): ClickEventInput {
  return {
    timestamp,
    referrer: request.referrer || '',
    userAgent: request.userAgent || '',
    ipAddress: request.ipAddress || '',
    utm_source: request.utm_source,
    utm_medium: request.utm_medium,
    utm_campaign: request.utm_campaign,
    utm_term: request.utm_term,
    utm_content: request.utm_content,
    trigger_source: request.trigger_source,
  };
}

/**
 * Tracks a click on a shortened link.
 * This is the main entry point for click tracking.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * @param shortCode - The short code of the link
 * @param request - The click request data
 * @param storageAdapter - The storage adapter to use for recording
 * @returns RedirectResult with the target URL or error
 */
export async function trackClick(
  shortCode: string,
  request: ClickRequest,
  storageAdapter: {
    getLinkByCode: (code: string) => Promise<{ id: string; originalUrl: string } | null>;
    recordClick: (linkId: string, event: ClickEventInput) => Promise<void>;
  }
): Promise<RedirectResult> {
  try {
    // Look up the link by short code
    const link = await storageAdapter.getLinkByCode(shortCode);

    if (!link) {
      return {
        success: false,
        redirectUrl: '',
        error: 'Link not found',
      };
    }

    // Create click event input
    const clickEventInput = createClickEventInput(request);

    // Validate the click event
    const validation = validateClickEvent(link.id, clickEventInput);
    if (!validation.valid) {
      // Log validation errors but still redirect
      console.warn('Click event validation failed:', validation.errors);
    }

    // Record the click (don't block redirect on failure)
    try {
      await storageAdapter.recordClick(link.id, clickEventInput);
    } catch (recordError) {
      // Log error but don't fail the redirect
      console.error('Failed to record click:', recordError);
    }

    return {
      success: true,
      redirectUrl: link.originalUrl,
    };
  } catch (error) {
    return {
      success: false,
      redirectUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
