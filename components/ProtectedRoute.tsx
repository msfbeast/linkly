import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component Props
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Guards routes requiring authentication by checking auth state
 * and redirecting unauthenticated users to login.
 * 
 * Requirements:
 * - 4.1: Redirect unauthenticated users from dashboard to login
 * - 4.2: Redirect unauthenticated users from link management pages to login
 * - 4.3: Render requested page for authenticated users
 * - 4.4: Redirect to login on session expiry, preserving intended destination
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  // This prevents flash of login page during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  // Preserve the intended destination in location state for post-login redirect
  if (!user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
