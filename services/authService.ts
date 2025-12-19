import { supabase, isSupabaseConfigured } from './storage/supabaseClient';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabaseAdapter } from './storage/supabaseAdapter';
import { emailService } from './emailService';

/**
 * User interface for the application
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    email_notifications?: boolean;
    onboarding_completed?: boolean;
    onboarding_step?: number;
    onboarding_skipped?: boolean;
    onboarding_started_at?: string;
    subscription_tier?: 'free' | 'pro' | 'business';
    subscription_status?: 'active' | 'trial' | 'past_due' | 'canceled';
    trial_ends_at?: string;
    razorpay_customer_id?: string;
    razorpay_subscription_id?: string;
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  displayName?: string;
  apiKey?: string;
  storefrontTheme?: string;
  storeName?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  flipkartAffiliateId?: string;
  amazonAssociateTag?: string;
  upiId?: string;
  emailVerified: boolean;
  createdAt: string;
  settingsNotifications?: {
    email: boolean;
    milestones: boolean;
    reports: boolean;
    security: boolean;
  };
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
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    apiKey: supabaseUser.user_metadata?.api_key,
    storefrontTheme: supabaseUser.user_metadata?.storefront_theme,
    storeName: supabaseUser.user_metadata?.store_name,
    storeLogoUrl: supabaseUser.user_metadata?.store_logo_url,
    storeBannerUrl: supabaseUser.user_metadata?.store_banner_url,
    upiId: supabaseUser.user_metadata?.upi_id,
    flipkartAffiliateId: supabaseUser.user_metadata?.flipkart_affiliate_id,
    amazonAssociateTag: supabaseUser.user_metadata?.amazon_associate_tag,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    createdAt: supabaseUser.created_at,
    user_metadata: supabaseUser.user_metadata,
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
   * Check if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return !data; // If no data returned, username is available
  },

  /**
   * Sign up a new user with email and password
   * Requirements: 1.1
   */
  async signUp(email: string, password: string, username?: string): Promise<AuthResponse> {
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
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          display_name: username || email.split('@')[0],
          username: username,
        }
      }
    });

    if (data.user && username) {
      try {
        // Create bio profile for the new user
        // Create bio profile for the new user
        await supabaseAdapter.createBioProfile(data.user.id, username, username);

        // Set defaults
        await supabaseAdapter.updateBioProfile(data.user.id, {
          bio: `Welcome to my Gather page!`,
          avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
          theme: 'vibrant',
          isPublished: true
        });
      } catch (err) {
        console.error('Failed to create bio profile:', err);
        // Don't fail signup if bio profile creation fails, but log it
      }
    }

    // Send welcome email
    if (data.user && data.user.email) {
      try {
        await emailService.sendWelcomeEmail(data.user.email, username || data.user.email.split('@')[0]);
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
        // Don't fail signup
      }
    }

    // Fetch profile for settings and preferences
    let settingsNotifications;
    let preferences;
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings_notifications, onboarding_completed, onboarding_step, onboarding_skipped, onboarding_started_at, subscription_tier, subscription_status, trial_ends_at, razorpay_customer_id, razorpay_subscription_id')
        .eq('id', data.user.id)
        .single();

      settingsNotifications = profile?.settings_notifications;
      preferences = {
        onboarding_completed: profile?.onboarding_completed,
        onboarding_step: profile?.onboarding_step,
        onboarding_skipped: profile?.onboarding_skipped,
        onboarding_started_at: profile?.onboarding_started_at,
        subscription_tier: profile?.subscription_tier,
        subscription_status: profile?.subscription_status,
        trial_ends_at: profile?.trial_ends_at,
        razorpay_customer_id: profile?.razorpay_customer_id,
        razorpay_subscription_id: profile?.razorpay_subscription_id,
      };
    }

    const user = mapSupabaseUser(data.user);
    if (user) {
      if (settingsNotifications) {
        user.settingsNotifications = settingsNotifications;
      }
      if (preferences) {
        user.preferences = {
          ...user.preferences,
          ...preferences,
        };
      }
    }

    return {
      user,
      session: data.session,
      error,
    };
  },

  /**
   * Sign in an existing user with email and password
   * Requirements: 2.1
   */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    const startTime = performance.now();

    if (!isSupabaseConfigured() || !supabase) {
      return {
        user: null,
        session: null,
        error: { message: 'Supabase is not configured', name: 'ConfigError', status: 500 } as AuthError,
      };
    }

    const authStartTime = performance.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error,
      };
    }

    // Handle "Remember me" by adjusting session persistence
    // Supabase handles session persistence via cookies/localStorage by default
    // The rememberMe flag can be used to clear session on browser close if false
    if (data.session && !rememberMe) {
      // Store a flag to indicate session should be cleared on browser close
      sessionStorage.setItem('gather_session_temp', 'true');
    } else {
      sessionStorage.removeItem('gather_session_temp');
    }

    // Return user immediately - profile will be fetched in background
    // This prevents login from hanging if profile query is slow
    const user = mapSupabaseUser(data.user);

    // Fetch profile in background (non-blocking) with a 3s timeout
    if (data.user && user) {

      // Don't await - let it run in background
      Promise.resolve(
        supabase
          .from('profiles')
          .select('settings_notifications, onboarding_completed, onboarding_step, onboarding_skipped, onboarding_started_at, subscription_tier, subscription_status, trial_ends_at, razorpay_customer_id, razorpay_subscription_id')
          .eq('id', data.user.id)
          .single()
      ).then(({ data: profile }) => {
        if (profile) {
          user.settingsNotifications = profile.settings_notifications;
          user.preferences = {
            ...user.preferences,
            onboarding_completed: profile.onboarding_completed,
            onboarding_step: profile.onboarding_step,
            onboarding_skipped: profile.onboarding_skipped,
            onboarding_started_at: profile.onboarding_started_at,
            subscription_tier: profile.subscription_tier,
            subscription_status: profile.subscription_status,
            trial_ends_at: profile.trial_ends_at,
            razorpay_customer_id: profile.razorpay_customer_id,
            razorpay_subscription_id: profile.razorpay_subscription_id,
          };
        }
      }).catch((err: Error) => {
        console.warn('[Auth] Profile fetch failed:', err);
      });
    }

    return {
      user,
      session: data.session,
      error: null,
    };
  },

  /**
   * Sign in with an OAuth provider (Google, GitHub)
   */
  async signInWithOAuth(provider: 'google' | 'github'): Promise<AuthResult> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        success: false,
        error: 'Supabase is not configured',
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
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
    sessionStorage.removeItem('gather_session_temp');
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
    storeName?: string;
    storeLogoUrl?: string;
    storeBannerUrl?: string;
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
        store_name: updates.storeName,
        store_logo_url: updates.storeLogoUrl,
        store_banner_url: updates.storeBannerUrl,
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
   * Requirements: 2.1
   */
  async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data } = await supabase.auth.getUser();

    // Fetch profile for settings and preferences
    let settingsNotifications;
    let preferences;
    if (data.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('settings_notifications, onboarding_completed, onboarding_step, onboarding_skipped, onboarding_started_at, subscription_tier, subscription_status, trial_ends_at, razorpay_customer_id, razorpay_subscription_id, role')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profile) {
          settingsNotifications = profile.settings_notifications;
          preferences = {
            onboarding_completed: profile.onboarding_completed,
            onboarding_step: profile.onboarding_step,
            onboarding_skipped: profile.onboarding_skipped,
            onboarding_started_at: profile.onboarding_started_at,
            subscription_tier: profile.subscription_tier,
            subscription_status: profile.subscription_status,
            trial_ends_at: profile.trial_ends_at,
            razorpay_customer_id: profile.razorpay_customer_id,
            razorpay_subscription_id: profile.razorpay_subscription_id,
          };
          // Map role directly to user object later
          if (profile.role) {
            (data.user as any).role = profile.role;
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Continue without profile data
      }
    }

    const user = mapSupabaseUser(data.user);
    if (user) {
      if (settingsNotifications) {
        user.settingsNotifications = settingsNotifications;
      }
      if (preferences) {
        user.preferences = {
          ...user.preferences,
          ...preferences,
        };
      }
    }

    return user;
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
