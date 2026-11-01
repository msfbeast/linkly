import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: user-authentication, Property 4: Data isolation - query filtering**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 * 
 * For any authenticated user querying links, the result set SHALL contain only 
 * links where user_id matches the authenticated user's ID.
 * 
 * Note: In production, Row Level Security (RLS) enforces this at the database level.
 * This test verifies the expected behavior that RLS provides - users only see their own data.
 */

import { createFakeSupabase, Responder } from '../../test/fakeSupabase';

// Mock the supabase client: each test sets `db.respond` and `db.session`.
const db = vi.hoisted(() => ({
  respond: (() => undefined) as any,
  session: null as any,
  calls: [] as any[],
}));

vi.mock('../storage/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: db.session } }),
    },
    from: (table: string) => {
      const fake = createFakeSupabase((call) => db.respond(call));
      const builder = fake.from(table);
      db.calls.push(fake.calls[0]);
      return builder;
    },
  },
  isSupabaseConfigured: () => true,
  TABLES: {
    LINKS: 'links',
    CLICK_EVENTS: 'click_events',
  },
}));

function useDb(userId: string | null, respond: Responder) {
  db.session = userId ? { user: { id: userId }, access_token: 'test-token' } : null;
  db.respond = respond;
  db.calls = [];
}

describe('Data Isolation Property Tests', () => {
  beforeEach(() => {
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
   * Generator for link row data
   */
  const linkRowArb = (userId: string) => fc.record({
    id: fc.uuid(),
    original_url: fc.webUrl(),
    short_code: fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    category: fc.constantFrom('social', 'marketing', 'product', 'other', null),
    created_at: fc.integer({ min: 1577836800000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
    clicks: fc.nat({ max: 10000 }),
    last_clicked_at: fc.option(
      fc.integer({ min: 1577836800000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
      { nil: null }
    ),
    smart_redirects: fc.constant(null),
    geo_redirects: fc.constant(null),
    expiration_date: fc.constant(null),
    max_clicks: fc.constant(null),
    password_hash: fc.constant(null),
    qr_code_data: fc.constant(null),
    ai_analysis: fc.constant(null),
    user_id: fc.constant(userId),
  });

  /**
   * Property 4: Data isolation - query filtering
   * For any authenticated user, getLinks queries only that user's links and
   * returns exactly what the database (RLS) gives back.
   */
  it('should only return links belonging to the authenticated user', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.integer({ min: 0, max: 10 }),
        async (userId, numLinks) => {
          const userLinks = fc.sample(linkRowArb(userId), numLinks);
          useDb(userId, (call) => (call.table === 'links' ? { data: userLinks } : { data: [] }));

          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          const links = await new SupabaseAdapter().getLinks();

          expect(links.length).toBe(numLinks);

          // The query itself must be scoped to this user's personal links.
          const linksQuery = db.calls.find(c => c.table === 'links');
          expect(linksQuery.has('eq', 'user_id', userId)).toBe(true);
          expect(linksQuery.has('is', 'team_id', null)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Data isolation - single link access
   * Accessing another user's link returns not found (RLS blocks it).
   */
  it('should return null when accessing a link not owned by the user (RLS simulation)', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        fc.uuid(), // Link ID
        async (currentUserId, linkId) => {
          useDb(currentUserId, () => ({ data: null, error: { code: 'PGRST116', message: 'Not found' } }));

          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          const link = await new SupabaseAdapter().getLink(linkId);

          expect(link).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Data isolation - user can access their own links
   */
  it('should return link when user accesses their own link', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        async (userId) => {
          const [userLink] = fc.sample(linkRowArb(userId), 1);
          useDb(userId, (call) => (call.table === 'links' ? { data: userLink } : { data: [] }));

          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          const link = await new SupabaseAdapter().getLink(userLink.id);

          expect(link).not.toBeNull();
          expect(link!.id).toBe(userLink.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
