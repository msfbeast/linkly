import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ViewState, LinkData } from './types';
import { getLinks } from './services/storageService';
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

  // Load links for total clicks display (use demo data if no real links)
  useEffect(() => {
    const storedLinks = getLinks();
    if (storedLinks.length === 0) {
      // Demo data for header display
      setLinks([
        { id: 'demo-1', clicks: 2847 } as LinkData,
        { id: 'demo-2', clicks: 1523 } as LinkData,
        { id: 'demo-3', clicks: 3156 } as LinkData,
        { id: 'demo-4', clicks: 892 } as LinkData,
      ]);
    } else {
      setLinks(storedLinks);
    }
  }, []);

  // Calculate total clicks and change percentage
  const totalClicks = links.reduce((acc, curr) => acc + curr.clicks, 0);
  const clickChange = links.length > 0 ? 12 : 0;

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
    }
  };

  // Refresh links when modal closes (for new link creation)
  const handleLinksUpdate = () => {
    setLinks(getLinks());
  };

  // API Page Component (Internal)
  const ApiPage = () => (
    <div className="p-8 max-w-5xl mx-auto pl-72">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Developer API</h1>
        <p className="text-slate-400">Integrate Linkly into your applications.</p>
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
{`curl -X POST https://api.linkly.ai/v1/links \\
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
{`curl -X GET https://api.linkly.ai/v1/stats/my-link \\
  -H "Authorization: Bearer lk_live_..."`}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-slate-200">
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
          {view === ViewState.SETTINGS && <Settings />}
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Component
 * Sets up routing and auth provider
 * Requirements: 4.1, 4.2, 4.3
 */
const App: React.FC = () => {
  const [redirectCode, setRedirectCode] = useState<string | null>(null);
  const [bioHandle, setBioHandle] = useState<string | null>(null);

  // Handle hash-based redirects for short links and bio pages
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/r/')) {
        const code = hash.replace('#/r/', '');
        setRedirectCode(code);
        setBioHandle(null);
      } else if (hash.startsWith('#/p/')) {
        const handle = hash.replace('#/p/', '');
        setBioHandle(handle);
        setRedirectCode(null);
      } else {
        setRedirectCode(null);
        setBioHandle(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If we are in redirect mode, show the Redirect page exclusively
  if (redirectCode) {
    return <Redirect code={redirectCode} />;
  }

  // If we are in Bio Page mode, show the Bio View exclusively
  if (bioHandle) {
    return <BioView handle={bioHandle} />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            
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
