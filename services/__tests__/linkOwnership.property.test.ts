import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: user-authentication, Property 3: Link ownership assignment**
 * **Validates: Requirements 5.1**
 * 
 * For any link created by an authenticated user, the link's user_id field 
 * SHALL equal the authenticated user's ID.
 */

// Mock uuid to return predictable values
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-link-id'),
}));

import { createFakeSupabase, QueryCall } from '../../test/fakeSupabase';

// Mock the supabase client: each test sets `db.session`; inserts are recorded.
const db = vi.hoisted(() => ({
  session: null as any,
  inserts: [] as Record<string, unknown>[],
}));

/** A free-tier user with no links yet; inserts echo back the inserted row. */
function respond(call: QueryCall) {
  if (call.table === 'profiles') return { data: { subscription_tier: 'free' } };
  const inserted = call.arg('insert')?.[0] as Record<string, unknown> | undefined;
  if (inserted) {
    db.inserts.push(inserted);
    return { data: inserted };
  }
  if (call.has('select', '*', { count: 'exact', head: true })) return { count: 0 };
  return { data: null };
}

vi.mock('../storage/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: db.session } }),
    },
    from: (table: string) => createFakeSupabase(respond).from(table),
  },
  isSupabaseConfigured: () => true,
  TABLES: {
    LINKS: 'links',
    CLICK_EVENTS: 'click_events',
    PROFILES: 'profiles',
  },
}));

describe('Link Ownership Property Tests', () => {
  beforeEach(() => {
    db.inserts = [];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Generator for user IDs (UUIDs)
   */
  const userIdArb = fc.uuid();

  /**
   * Generator for valid link data
   */
  const linkDataArb = fc.record({
    originalUrl: fc.webUrl(),
    shortCode: fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    category: fc.constantFrom('social', 'marketing', 'product', 'other', undefined),
    createdAt: fc.integer({ min: 1577836800000, max: Date.now() }), // Valid timestamp range
    clicks: fc.nat({ max: 10000 }),
    clickHistory: fc.constant([] as any[]),
  });

  /**
   * Property 3: Link ownership assignment
   * For any authenticated user creating a link, the link's user_id should equal the user's ID
   */
  it('should set user_id to authenticated user ID when creating a link', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        linkDataArb,
        async (userId, linkData) => {
          db.session = { user: { id: userId }, access_token: 'test-token' };
          db.inserts = [];

          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          await new SupabaseAdapter().createLink(linkData);

          expect(db.inserts).toHaveLength(1);
          expect(db.inserts[0].user_id).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Unauthenticated users can't create owned links
   * Without a session createLink refuses and inserts nothing. (Anonymous
   * guest links go through dedicated SECURITY DEFINER RPCs instead.)
   */
  it('should refuse to create a link when no authenticated session exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkDataArb,
        async (linkData) => {
          db.session = null;
          db.inserts = [];

          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          await expect(new SupabaseAdapter().createLink(linkData)).rejects.toThrow('User ID is required');

          expect(db.inserts).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
