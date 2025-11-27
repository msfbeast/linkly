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

// Mock the supabase client
const mockGetSession = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('../storage/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: () => true,
  TABLES: {
    LINKS: 'links',
    CLICK_EVENTS: 'click_events',
  },
}));

describe('Link Ownership Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup chain: from().insert().select().single()
    mockSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    clickHistory: fc.constant([]),
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
          // Reset mocks for each iteration
          mockGetSession.mockReset();
          mockInsert.mockReset();
          mockSelect.mockReset();
          mockSingle.mockReset();
          mockFrom.mockReset();
          
          // Setup: Mock an authenticated session with the generated user ID
          mockGetSession.mockResolvedValue({
            data: {
              session: {
                user: { id: userId },
                access_token: 'test-token',
              },
            },
          });
          
          // Capture the inserted data
          let capturedInsertData: Record<string, unknown> | null = null;
          
          mockInsert.mockImplementation((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return { select: mockSelect };
          });
          
          mockSelect.mockReturnValue({ single: mockSingle });
          mockSingle.mockResolvedValue({
            data: {
              id: 'test-link-id',
              original_url: linkData.originalUrl,
              short_code: linkData.shortCode,
              title: linkData.title,
              description: linkData.description ?? null,
              tags: linkData.tags,
              category: linkData.category ?? null,
              created_at: new Date(linkData.createdAt).toISOString(),
              clicks: linkData.clicks,
              last_clicked_at: null,
              smart_redirects: null,
              geo_redirects: null,
              expiration_date: null,
              max_clicks: null,
              password_hash: null,
              qr_code_data: null,
              ai_analysis: null,
              user_id: userId,
            },
            error: null,
          });
          
          mockFrom.mockReturnValue({ insert: mockInsert });
          
          // Import SupabaseAdapter fresh to use mocked supabase
          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          const adapter = new SupabaseAdapter();
          
          // Create the link
          await adapter.createLink(linkData);
          
          // Verify the inserted data contains the correct user_id
          expect(capturedInsertData).not.toBeNull();
          expect(capturedInsertData!.user_id).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Unauthenticated users should have null user_id
   * For any link created without authentication, user_id should be null
   */
  it('should set user_id to null when no authenticated session exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkDataArb,
        async (linkData) => {
          // Reset mocks for each iteration
          mockGetSession.mockReset();
          mockInsert.mockReset();
          mockSelect.mockReset();
          mockSingle.mockReset();
          mockFrom.mockReset();
          
          // Setup: Mock no authenticated session
          mockGetSession.mockResolvedValue({
            data: { session: null },
          });
          
          // Capture the inserted data
          let capturedInsertData: Record<string, unknown> | null = null;
          
          mockInsert.mockImplementation((data: Record<string, unknown>) => {
            capturedInsertData = data;
            return { select: mockSelect };
          });
          
          mockSelect.mockReturnValue({ single: mockSingle });
          mockSingle.mockResolvedValue({
            data: {
              id: 'test-link-id',
              original_url: linkData.originalUrl,
              short_code: linkData.shortCode,
              title: linkData.title,
              description: linkData.description ?? null,
              tags: linkData.tags,
              category: linkData.category ?? null,
              created_at: new Date(linkData.createdAt).toISOString(),
              clicks: linkData.clicks,
              last_clicked_at: null,
              smart_redirects: null,
              geo_redirects: null,
              expiration_date: null,
              max_clicks: null,
              password_hash: null,
              qr_code_data: null,
              ai_analysis: null,
              user_id: null,
            },
            error: null,
          });
          
          mockFrom.mockReturnValue({ insert: mockInsert });
          
          // Import SupabaseAdapter fresh to use mocked supabase
          const { SupabaseAdapter } = await import('../storage/supabaseAdapter');
          const adapter = new SupabaseAdapter();
          
          // Create the link
          await adapter.createLink(linkData);
          
          // Verify the inserted data has null user_id
          expect(capturedInsertData).not.toBeNull();
          expect(capturedInsertData!.user_id).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
