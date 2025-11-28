import { supabase, isSupabaseConfigured } from './storage/supabaseClient';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';

/**
 * User interface for the application
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  apiKey?: string;
  storefrontTheme?: string;
  flipkartAffiliateId?: string;
  amazonAssociateTag?: string;
  emailVerified: boolean;
  createdAt: string;
}

/**
 * Auth response interface
 */
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Auth result interface for simplified responses
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Convert Supabase user to application User
 */
function mapSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName: supabaseUser.user_metadata?.display_name,
    apiKey: supabaseUser.user_metadata?.api_key,
    storefrontTheme: supabaseUser.user_metadata?.storefront_theme,
    flipkartAffiliateId: supabaseUser.user_metadata?.flipkart_affiliate_id,
    amazonAssociateTag: supabaseUser.user_metadata?.amazon_associate_tag,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    createdAt: supabaseUser.created_at,
  };
}

/**
 * Normalize auth errors to user-friendly messages
 */
function normalizeAuthError(error: AuthError | null): string | undefined {
  if (!error) return undefined;

  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'User already registered': 'An account with this email already exists',
    'Email not confirmed': 'Please verify your email before logging in',
    'Password should be at least 6 characters': 'Password must be at least 8 characters',
  };

  return errorMap[error.message] || error.message;
}


/**
 * Auth Service - Wraps Supabase Auth methods with error handling
 */
export const authService = {
  /**
   * Sign up a new user with email and password
   * Requirements: 1.1
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: mapSupabaseUser(data.user),
      session: data.session,
      error,
    };
  },

  /**
   * Sign in an existing user with email and password
   * Requirements: 2.1
   */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle "Remember me" by adjusting session persistence
    // Supabase handles session persistence via cookies/localStorage by default
    // The rememberMe flag can be used to clear session on browser close if false
    if (data.session && !rememberMe) {
      // Store a flag to indicate session should be cleared on browser close
      sessionStorage.setItem('linkly_session_temp', 'true');
    } else {
      sessionStorage.removeItem('linkly_session_temp');
    }

    return {
      user: mapSupabaseUser(data.user),
      session: data.session,
      error,
    };
  },

  /**
   * Sign out the current user
   * Requirements: 3.1
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    await supabase.auth.signOut();
    sessionStorage.removeItem('linkly_session_temp');
  },

  /**
   * Request a password reset email
   * Requirements: 6.1
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    // Always return success to prevent email enumeration (Requirement 6.2)
    return {
      user: null,
      session: null,
      error: null,
    };
  },

  /**
   * Update the user's password (after reset)
   * Requirements: 6.4
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return {
      user: mapSupabaseUser(data.user),
      session: null,
      error,
    };
  },

  /**
   * Update user profile data
   */
  async updateProfile(updates: {
    displayName?: string;
    storefrontTheme?: string;
    flipkartAffiliateId?: string;
    amazonAssociateTag?: string;
  }): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        storefront_theme: updates.storefrontTheme,
        flipkart_affiliate_id: updates.flipkartAffiliateId,
        amazon_associate_tag: updates.amazonAssociateTag,
      },
    });

    return {
      user: mapSupabaseUser(data.user),
      session: null, // Session isn't returned by updateUser, but user data is
      error,
    };
  },

  /**
   * Update user API key
   */
  async updateApiKey(apiKey: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        api_key: apiKey,
      },
    });

    return {
      user: mapSupabaseUser(data.user),
      session: null,
      error,
    };
  },

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data } = await supabase.auth.getUser();
    return mapSupabaseUser(data.user);
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => { };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });

    return () => subscription.unsubscribe();
  },
};

/**
 * Helper to convert AuthResponse to AuthResult
 */
export function toAuthResult(response: AuthResponse): AuthResult {
  return {
    success: response.error === null,
    error: normalizeAuthError(response.error),
  };
}
