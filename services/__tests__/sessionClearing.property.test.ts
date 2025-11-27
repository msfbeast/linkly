import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: user-authentication, Property 2: Session clearing on logout**
 * **Validates: Requirements 3.2**
 * 
 * For any authenticated session, after calling signOut, the getSession function 
 * SHALL return null.
 * 
 * This property test verifies that the session clearing mechanism works correctly
 * by testing the authService's signOut behavior and ensuring session state is
 * properly cleared.
 */

// Mock the supabase client
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../storage/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
  isSupabaseConfigured: () => true,
}));

describe('Session Clearing Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  /**
   * Generator for session-like objects
   */
  const sessionArb = fc.record({
    access_token: fc.string({ minLength: 10, maxLength: 100 }),
    refresh_token: fc.string({ minLength: 10, maxLength: 100 }),
    expires_in: fc.integer({ min: 3600, max: 86400 }),
    token_type: fc.constant('bearer'),
    user: fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      created_at: fc.date().map(d => d.toISOString()),
    }),
  });

  /**
   * Property 2: After signOut, getSession should return null
   * For any authenticated session, calling signOut should clear the session
   */
  it('should clear session after signOut for any authenticated session', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionArb,
        async (session) => {
          // Reset mocks for each iteration
          mockSignOut.mockReset();
          mockGetSession.mockReset();
          sessionStorage.clear();
          
          // Setup: Mock an authenticated session
          mockGetSession.mockResolvedValueOnce({ data: { session } });
          mockSignOut.mockResolvedValueOnce({ error: null });
          
          // After signOut, getSession should return null
          mockGetSession.mockResolvedValueOnce({ data: { session: null } });
          
          // Import authService fresh to use mocked supabase
          const { authService } = await import('../authService');
          
          // Verify initial session exists
          const initialSession = await authService.getSession();
          expect(initialSession).not.toBeNull();
          
          // Call signOut
          await authService.signOut();
          
          // Verify signOut was called
          expect(mockSignOut).toHaveBeenCalled();
          
          // Verify session is now null
          const finalSession = await authService.getSession();
          expect(finalSession).toBeNull();
          
          // Verify sessionStorage temp flag is cleared
          expect(sessionStorage.getItem('linkly_session_temp')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: signOut should clear sessionStorage temp flag
   * For any session with rememberMe=false, the temp flag should be cleared on signOut
   */
  it('should clear sessionStorage temp flag on signOut', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (hadTempFlag) => {
          // Reset mocks
          mockSignOut.mockReset();
          sessionStorage.clear();
          
          // Setup: Set temp flag if applicable
          if (hadTempFlag) {
            sessionStorage.setItem('linkly_session_temp', 'true');
          }
          
          mockSignOut.mockResolvedValueOnce({ error: null });
          
          const { authService } = await import('../authService');
          
          // Call signOut
          await authService.signOut();
          
          // Verify temp flag is cleared regardless of initial state
          expect(sessionStorage.getItem('linkly_session_temp')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: signOut should be idempotent
   * Calling signOut multiple times should not cause errors
   */
  it('should handle multiple signOut calls gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (numCalls) => {
          // Reset mocks
          mockSignOut.mockReset();
          sessionStorage.clear();
          
          mockSignOut.mockResolvedValue({ error: null });
          mockGetSession.mockResolvedValue({ data: { session: null } });
          
          const { authService } = await import('../authService');
          
          // Call signOut multiple times
          for (let i = 0; i < numCalls; i++) {
            await authService.signOut();
          }
          
          // Should not throw and session should be null
          const session = await authService.getSession();
          expect(session).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
