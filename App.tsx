import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopNavigation from './components/TopNavigation';
import LoadingFallback from './components/LoadingFallback';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ViewState, LinkData } from './types';
import { supabaseAdapter } from './services/storage/supabaseAdapter';
import { Copy, Terminal } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import OnboardingTour from './components/OnboardingTour';
import { TrialCountdown } from './components/TrialCountdown';
import InstallPrompt from './components/InstallPrompt';
import Login from './pages/Login';
import Register from './pages/Register';
import Redirect from './pages/Redirect';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import ClaimLinkPage from './pages/ClaimLinkPage';
import BioView from './pages/BioView';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToHashElement from './components/ScrollToHashElement';

import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Load Non-Critical Pages
const DashboardLayout = React.lazy(() => import('./components/DashboardLayout'));
const Storefront = React.lazy(() => import('./pages/Storefront'));
const ProductPage = React.lazy(() => import('./pages/ProductPage'));
const TeamInviteHandler = React.lazy(() => import('./pages/TeamInviteHandler'));
const ApiPage = React.lazy(() => import('./pages/ApiPage'));
const LinkAnalytics = React.lazy(() => import('./pages/LinkAnalytics'));
const LegalPage = React.lazy(() => import('./pages/LegalPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ComingSoonPage = React.lazy(() => import('./pages/ComingSoonPage'));

/**
 * Main App Component
 * Sets up routing and auth provider
 * Requirements: 4.1, 4.2, 4.3
 */
// Legacy Hash Redirect Component
const LegacyHashHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/r/')) {
        const code = hash.replace('#/r/', '');
        navigate(`/r/${code}`, { replace: true });
      } else if (hash.startsWith('#/p/')) {
        const handle = hash.replace('#/p/', '');
        navigate(`/p/${handle}`, { replace: true });
      }
    };

    // Check on mount
    handleHashChange();

    // Check on hash change
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  return null;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Public Link & Bio Routes */}
          <Route path="/r/:code" element={<Redirect />} />
          <Route path="/p/:handle" element={<BioView />} />
          <Route path="/@:handle" element={<BioView />} />

          <Route path="/store/:userId" element={<Storefront />} />
          <Route path="/store/product/:productId" element={<ProductPage />} />

          {/* Claim Guest Link */}
          <Route path="/claim/:token" element={<ClaimLinkPage />} />
          <Route path="/team/invite/:token" element={<TeamInviteHandler />} />
          <Route path="/api-access" element={<ApiPage />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Footer Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/cookies" element={<LegalPage />} />
          <Route path="/blog" element={<ComingSoonPage />} />
          <Route path="/careers" element={<ComingSoonPage />} />
          <Route path="/community" element={<ComingSoonPage />} />
          <Route path="/help" element={<ComingSoonPage />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected routes - Requirements 4.1, 4.2, 4.3 */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/:id"
            element={
              <ProtectedRoute>
                <LinkAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/api"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LegacyHashHandler />
          <ScrollToHashElement />
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
          <InstallPrompt />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
