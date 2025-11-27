import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { authService, User, AuthResult, toAuthResult } from '../services/authService';
import { validatePassword } from '../services/passwordValidation';

/**
 * Auth Context Type
 * Requirements: 2.1, 3.1, 3.2
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Provides authentication state and methods throughout the app
 * Requirements: 2.1, 3.1, 3.2
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const initialSession = await authService.getSession();
        if (mounted) {
          setSession(initialSession);
          if (initialSession) {
            const currentUser = await authService.getUser();
            setUser(currentUser);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener for session sync
    const unsubscribe = authService.onAuthStateChange(async (newSession) => {
      if (mounted) {
        setSession(newSession);
        if (newSession) {
          const currentUser = await authService.getUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);


  /**
   * Sign up a new user
   * Requirements: 1.1, 1.3
   */
  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Validate password before attempting signup
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors[0] || 'Invalid password',
      };
    }

    const response = await authService.signUp(email, password);
    return toAuthResult(response);
  }, []);

  /**
   * Sign in an existing user
   * Requirements: 2.1, 2.3, 2.4
   */
  const signIn = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<AuthResult> => {
    const response = await authService.signIn(email, password, rememberMe);
    return toAuthResult(response);
  }, []);

  /**
   * Sign out the current user
   * Clears session and all local authentication tokens
   * Requirements: 3.1, 3.2
   */
  const signOut = useCallback(async (): Promise<void> => {
    await authService.signOut();
    // State will be updated via onAuthStateChange listener
    // But we also explicitly clear to ensure immediate UI update
    setUser(null);
    setSession(null);
  }, []);

  /**
   * Request a password reset email
   * Requirements: 6.1, 6.2
   */
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const response = await authService.resetPassword(email);
    return toAuthResult(response);
  }, []);

  /**
   * Update the user's password
   * Requirements: 6.3, 6.4
   */
  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors[0] || 'Invalid password',
      };
    }

    const response = await authService.updatePassword(newPassword);
    return toAuthResult(response);
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
