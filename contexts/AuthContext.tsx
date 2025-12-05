import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { authService, User, AuthResult, toAuthResult } from '../services/authService';
import { validatePassword } from '../services/passwordValidation';
import { supabase } from '../services/storage/supabaseClient';

/**
 * Auth Context Type
 * Requirements: 2.1, 3.1, 3.2
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateProfile: (data: {
    displayName?: string;
    storefrontTheme?: string;
    storeName?: string;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
    flipkartAffiliateId?: string;
    amazonAssociateTag?: string;
  }) => Promise<AuthResult>;
  regenerateApiKey: () => Promise<AuthResult>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Setting up auth listener...');

    // Listen for auth state changes - this is the PRIMARY source of session state
    // onAuthStateChange will fire immediately with the current session if one exists
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session ? 'has session' : 'no session');

      setSession(session);

      if (session?.user) {
        console.log('[Auth] Session found, fetching user details...');
        try {
          // Add timeout to prevent hanging
          const userPromise = authService.getUser();
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
              console.warn('[Auth] User fetch timed out after 5s');
              resolve(null);
            }, 5000)
          );

          const user = await Promise.race([userPromise, timeoutPromise]);
          if (user) {
            setUser(user);
            console.log('[Auth] User loaded:', user?.email);
          } else {
            // Still have session, just couldn't get extended user details
            console.log('[Auth] Using session user as fallback');
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              emailVerified: session.user.email_confirmed_at != null,
              createdAt: session.user.created_at || new Date().toISOString(),
              user_metadata: session.user.user_metadata,
            } as any);
          }
        } catch (error) {
          console.error('[Auth] Error fetching user:', error);
          // Still have session, create minimal user from session
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            emailVerified: session.user.email_confirmed_at != null,
            createdAt: session.user.created_at || new Date().toISOString(),
            user_metadata: session.user.user_metadata,
          } as any);
        }
      } else {
        console.log('[Auth] No session, clearing user');
        setUser(null);
      }

      // Always set loading to false after processing
      setLoading(false);
      console.log('[Auth] Loading set to false');
    });

    // Fallback: If onAuthStateChange doesn't fire within 3 seconds, check manually
    const fallbackTimeout = setTimeout(async () => {
      console.log('[Auth] Fallback timeout triggered, checking session manually...');
      try {
        const session = await authService.getSession();
        if (session && !user) {
          console.log('[Auth] Fallback found session');
          setSession(session);
          if (session.user) {
            const user = await authService.getUser();
            setUser(user);
          }
        }
      } catch (err) {
        console.error('[Auth] Fallback session check failed:', err);
      } finally {
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const result = await authService.signUp(email, password, username);
    if (result.user) setUser(result.user);
    return toAuthResult(result);
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const result = await authService.signIn(email, password, rememberMe);
    if (result.user) setUser(result.user);
    return toAuthResult(result);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await authService.resetPassword(email);
    return toAuthResult(result);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const result = await authService.updatePassword(newPassword);
    if (result.user) setUser(result.user);
    return toAuthResult(result);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: {
    displayName?: string;
    storefrontTheme?: string;
    storeName?: string;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
    upiId?: string;
    flipkartAffiliateId?: string;
    amazonAssociateTag?: string;
  }): Promise<AuthResult> => {
    const response = await authService.updateProfile(data);

    if (response.user) {
      setUser(response.user);
    }

    return toAuthResult(response);
  }, []);

  /**
   * Regenerate API Key
   */
  const regenerateApiKey = useCallback(async (): Promise<AuthResult> => {
    // Generate a new key (lk_live_ + random string)
    const newKey = 'lk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const response = await authService.updateApiKey(newKey);

    if (response.user) {
      setUser(response.user);
    }

    return toAuthResult(response);
  }, []);

  /**
   * Check if a username is available
   */
  const checkUsernameAvailability = useCallback(async (username: string): Promise<boolean> => {
    return await authService.checkUsernameAvailability(username);
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    regenerateApiKey,
    checkUsernameAvailability,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
