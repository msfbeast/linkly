import React, { useState, useEffect, Suspense } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopNavigation from './components/TopNavigation';
import LoadingFallback from './components/LoadingFallback';
import { AuthProvider } from './contexts/AuthContext';
import { TeamProvider } from './contexts/TeamContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ViewState, LinkData } from './types';
import { supabaseAdapter } from './services/storage/supabaseAdapter';
import { Copy, Terminal } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';
import Pricing from './pages/Pricing';
import OnboardingTour from './components/OnboardingTour';
import { TrialCountdown } from './components/TrialCountdown';
import InstallPrompt from './components/pwa/InstallPrompt';
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
import { Toaster } from 'sonner';
import DomainRouter from './components/DomainRouter';

// Lazy Load Non-Critical Pages
// Lazy Load Non-Critical Pages
const DashboardLayout = React.lazy(() => import('./components/DashboardLayout'));
const Storefront = React.lazy(() => import('./pages/Storefront'));
const ProductPage = React.lazy(() => import('./pages/ProductPage'));
const TeamInviteHandler = React.lazy(() => import('./pages/TeamInviteHandler'));
const AddProduct = React.lazy(() => import('./pages/AddProduct')); // Lazy load
const ApiPage = React.lazy(() => import('./pages/ApiPage'));
const LinkAnalytics = React.lazy(() => import('./pages/LinkAnalytics'));
const SharedAnalytics = React.lazy(() => import('./pages/SharedAnalytics'));
const LegalPage = React.lazy(() => import('./pages/LegalPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ComingSoonPage = React.lazy(() => import('./pages/ComingSoonPage'));
const SmartRedirect = React.lazy(() => import('./pages/SmartRedirect'));
const AffiliateManager = React.lazy(() => import('./pages/AffiliateManager'));
const AgencyDashboard = React.lazy(() => import('./pages/AgencyDashboard'));


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
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Cookies = React.lazy(() => import('./pages/Cookies'));
const CookieConsent = React.lazy(() => import('./components/CookieConsent'));

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        {/* Cookie Consent Banner - Global */}
        <CookieConsent />

        <Routes location={location} key={location.pathname}>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* Legal routes */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />

          {/* Public Link & Bio Routes */}
          <Route path="/r/:code" element={<Redirect />} />
          <Route path="/p/:handle" element={<BioView />} />
          <Route path="/@:handle" element={<BioView />} /> {/* Added this back as it was removed in the instruction but is a valid route */}
          <Route path="/s/:domain" element={<SmartRedirect />} />

          {/* Store Routes */}
          <Route path="/claim/:token" element={<ClaimLinkPage />} /> {/* Changed from /claim-link to /claim/:token */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/team/invite/:token" element={<TeamInviteHandler />} /> {/* Moved here from protected */}
          <Route path="/open/:url" element={<SmartRedirect />} /> {/* Moved here from protected */}
          <Route path="/share/:shareToken" element={<SharedAnalytics />} /> {/* Moved here from protected */}
          <Route path="/about" element={<AboutPage />} /> {/* Moved here from protected */}
          <Route path="/api-access" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
          <Route path="/blog" element={<ComingSoonPage />} /> {/* Moved here from protected */}
          <Route path="/careers" element={<ComingSoonPage />} /> {/* Moved here from protected */}
          <Route path="/community" element={<ComingSoonPage />} /> {/* Moved here from protected */}
          <Route path="/help" element={<ComingSoonPage />} /> {/* Moved here from protected */}
          <Route path="/" element={<LandingPage />} /> {/* Moved here from protected */}

          {/* Protected Routes Group */}
          {[
            "/dashboard",
            "/dashboard/*",
            "/settings",
            "/settings/api",
            "/links",
            "/bio",
            "/analytics",
            "/products",
            "/affiliate",
            "/agency",
            "/team/settings"
          ].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
          ))}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/store/:userId" element={<Storefront />} />

          <Route
            path="/product/:productId"
            element={
              <ProtectedRoute>
                <ProductPage />
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
            path="/affiliate-manager"
            element={
              <ProtectedRoute>
                <AffiliateManager />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence >
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TeamProvider>
            <LegacyHashHandler />
            <ScrollToHashElement />
            <ErrorBoundary>
              <DomainRouter>
                <AnimatedRoutes />
              </DomainRouter>
            </ErrorBoundary>
            <InstallPrompt />
            <Toaster richColors position="top-center" />
            <Analytics />
            <SpeedInsights />
          </TeamProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
