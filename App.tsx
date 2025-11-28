import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import IconSidebar from './components/IconSidebar';
import TopNavigation from './components/TopNavigation';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Redirect from './pages/Redirect';
import BioDashboard from './pages/BioDashboard';
import BioView from './pages/BioView';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import Settings from './pages/Settings';
import GlobalAnalytics from './pages/GlobalAnalytics';
import ProductManager from './pages/ProductManager';
import Storefront from './pages/Storefront';
import ProductPage from './pages/ProductPage';
import LinkAnalytics from './pages/LinkAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ViewState, LinkData } from './types';
import { supabaseAdapter } from './services/storage/supabaseAdapter';
import { Copy, Terminal } from 'lucide-react';

/**
 * Main Dashboard Layout Component
 * Contains the sidebar, navigation, and main content area
 */
const DashboardLayout: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState<LinkData[]>([]);

  const [clickChange, setClickChange] = useState(0);

  // Load real links from Supabase
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const realLinks = await supabaseAdapter.getLinks();
        setLinks(realLinks);

        // Calculate real click change (compare last 7 days vs previous 7 days)
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;

        let recentClicks = 0;
        let previousClicks = 0;

        realLinks.forEach(link => {
          (link.clickHistory || []).forEach(click => {
            const age = now - click.timestamp;
            if (age < oneWeek) {
              recentClicks++;
            } else if (age < twoWeeks) {
              previousClicks++;
            }
          });
        });

        if (previousClicks > 0) {
          const change = Math.round(((recentClicks - previousClicks) / previousClicks) * 100);
          setClickChange(change);
        } else if (recentClicks > 0) {
          setClickChange(100);
        } else {
          setClickChange(0);
        }
      } catch (error) {
        console.error('Failed to load links:', error);
      }
    };
    loadLinks();
  }, []);

  // Calculate total clicks from real data
  const totalClicks = links.reduce((acc, curr) => acc + curr.clicks, 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // C - Create new link
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsModalOpen(true);
      }

      // D - Go to Dashboard
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSidebarItemClick('dashboard');
      }

      // L - Go to Links
      if (e.key === 'l' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSidebarItemClick('links');
      }

      // A - Go to Analytics
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSidebarItemClick('analytics');
      }

      // S - Go to Settings
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleSidebarItemClick('settings');
      }

      // Escape - Close modal
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handle sidebar item click
  const handleSidebarItemClick = (item: string) => {
    setActiveSidebarItem(item);
    switch (item) {
      case 'dashboard':
        setView(ViewState.DASHBOARD);
        break;
      case 'links':
        setView(ViewState.LINKS);
        break;
      case 'analytics':
        setView(ViewState.ANALYTICS);
        break;
      case 'settings':
        setView(ViewState.SETTINGS);
        break;
      case 'products':
        setView(ViewState.PRODUCTS);
        break;
    }
  };

  // Refresh links when modal closes (for new link creation)
  const handleLinksUpdate = async () => {
    try {
      const realLinks = await supabaseAdapter.getLinks();
      setLinks(realLinks);
    } catch (error) {
      console.error('Failed to refresh links:', error);
    }
  };

  // API Page Component (Internal)
  const ApiPage = () => (
    <div className="p-8 max-w-5xl mx-auto pl-72">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Developer API</h1>
        <p className="text-slate-400">Integrate Gather into your applications.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-bold mb-4">Your API Key</h3>
        <div className="flex items-center gap-2">
          <code className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-emerald-400 font-mono flex-1">
            lk_live_592834729834729384729384
          </code>
          <button className="bg-slate-800 text-slate-300 p-3 rounded-lg hover:bg-slate-700 transition-colors">
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Keep this key secret. Do not share it in client-side code.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="text-white font-bold">Create a Link</h3>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto">
            {`curl -X POST https://api.gather.ai/v1/links \\
  -H "Authorization: Bearer lk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "slug": "my-link",
    "smartRedirects": {
       "ios": "https://apps.apple.com..."
    }
  }'`}
          </pre>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-indigo-500" />
            <h3 className="text-white font-bold">Get Analytics</h3>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto">
            {`curl -X GET https://api.gather.ai/v1/stats/my-link \\
  -H "Authorization: Bearer lk_live_..."`}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-slate-900">
      {/* Icon Sidebar */}
      <IconSidebar
        activeItem={activeSidebarItem}
        onItemClick={handleSidebarItemClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-16 flex flex-col">
        {/* Top Navigation */}
        <TopNavigation
          totalClicks={totalClicks}
          clickChange={clickChange}
          onNewLinkClick={() => setIsModalOpen(true)}
          onSettingsClick={() => handleSidebarItemClick('settings')}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {view === ViewState.DASHBOARD && (
            <Dashboard
              externalModalOpen={isModalOpen}
              setExternalModalOpen={setIsModalOpen}
              onLinksUpdate={handleLinksUpdate}
            />
          )}
          {view === ViewState.LINKS && (
            <Links
              externalModalOpen={isModalOpen}
              setExternalModalOpen={setIsModalOpen}
              onLinksUpdate={handleLinksUpdate}
            />
          )}
          {view === ViewState.BIO_PAGES && <BioDashboard />}
          {view === ViewState.API && <ApiPage />}
          {view === ViewState.ANALYTICS && <GlobalAnalytics />}
          {view === ViewState.PRODUCTS && <ProductManager />}
          {view === ViewState.SETTINGS && <Settings />}
        </div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="relative bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-3">
              {[
                { key: 'C', action: 'Create new link' },
                { key: 'D', action: 'Go to Dashboard' },
                { key: 'L', action: 'Go to Links' },
                { key: 'A', action: 'Go to Analytics' },
                { key: 'S', action: 'Go to Settings' },
                { key: 'Esc', action: 'Close modal' },
                { key: '?', action: 'Toggle this help' },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-slate-400">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LegacyHashHandler />
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* Public Link & Bio Routes */}
            <Route path="/r/:code" element={<Redirect />} />
            <Route path="/p/:handle" element={<BioView />} />

            <Route path="/store/:userId" element={<Storefront />} />
            <Route path="/store/product/:productId" element={<ProductPage />} />

            {/* Protected routes - Requirements 4.1, 4.2, 4.3 */}
            <Route
              path="/"
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
