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
  signInWithOAuth: (provider: 'google' | 'github') => Promise<AuthResult>;
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

    // Listen for auth state changes - this is the PRIMARY source of session state
    // onAuthStateChange will fire immediately with the current session if one exists
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {

      setSession(session);

      if (session?.user) {
        // Set user from session immediately (for fast page load)
        const sessionUser = {
          id: session.user.id,
          email: session.user.email || '',
          emailVerified: session.user.email_confirmed_at != null,
          createdAt: session.user.created_at || new Date().toISOString(),
          user_metadata: session.user.user_metadata,
          displayName: session.user.user_metadata?.display_name,
          storeName: session.user.user_metadata?.store_name,
          apiKey: session.user.user_metadata?.api_key,
        } as any;

        setUser(sessionUser);
        setLoading(false);

        // Fetch full user details in background (non-blocking)
        authService.getUser().then(fullUser => {
          if (fullUser) setUser(fullUser);
        }).catch(() => { });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Fallback: If onAuthStateChange doesn't fire within 2 seconds, set loading false
    const fallbackTimeout = setTimeout(() => setLoading(false), 2000);

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



  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    return await authService.signInWithOAuth(provider);
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
    signInWithOAuth,
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
