import React, { useState, useEffect, Suspense } from 'react';
import { ViewState, LinkData } from '../types';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import { TrialCountdown } from './TrialCountdown';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import LoadingFallback from './LoadingFallback';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Links = React.lazy(() => import('../pages/Links'));
const BioDashboard = React.lazy(() => import('../pages/BioDashboard'));
const Settings = React.lazy(() => import('../pages/Settings'));
const GlobalAnalytics = React.lazy(() => import('../pages/GlobalAnalytics'));
const ProductManager = React.lazy(() => import('../pages/ProductManager'));
const ApiPage = React.lazy(() => import('../pages/ApiPage'));

const DashboardLayout: React.FC = () => {
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
    const [activeSidebarItem, setActiveSidebarItem] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [links, setLinks] = useState<LinkData[]>([]);
    const [clickChange, setClickChange] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);

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

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] text-slate-900">
            {/* Sidebar - Hidden on Mobile */}
            <div className="hidden md:block">
                <Sidebar
                    currentView={view}
                    onChangeView={(newView) => {
                        setView(newView);
                        const itemMap: Record<string, string> = {
                            [ViewState.DASHBOARD]: 'dashboard',
                            [ViewState.LINKS]: 'links',
                            [ViewState.ANALYTICS]: 'analytics',
                            [ViewState.SETTINGS]: 'settings',
                            [ViewState.PRODUCTS]: 'products',
                            [ViewState.API]: 'api',
                            [ViewState.BIO_PAGES]: 'bio',
                        };
                        const key = Object.keys(itemMap).find(k => k === newView);
                        if (key) setActiveSidebarItem(itemMap[key]);
                    }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col transition-all duration-300">
                {/* Top Navigation */}
                <TopNavigation
                    totalClicks={totalClicks}
                    clickChange={clickChange}
                    onNewLinkClick={() => setIsModalOpen(true)}
                    onSettingsClick={() => handleSidebarItemClick('settings')}
                    currentView={view}
                    onChangeView={(newView) => {
                        setView(newView);
                        const itemMap: Record<string, string> = {
                            [ViewState.DASHBOARD]: 'dashboard',
                            [ViewState.LINKS]: 'links',
                            [ViewState.ANALYTICS]: 'analytics',
                            [ViewState.SETTINGS]: 'settings',
                            [ViewState.PRODUCTS]: 'products',
                            [ViewState.API]: 'api',
                        };
                        const key = Object.keys(itemMap).find(k => k === newView);
                        if (key) setActiveSidebarItem(itemMap[key]);
                    }}
                />

                {/* Page Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <TrialCountdown />

                    <main className="flex-1 overflow-y-auto bg-[#FDFBF7] scroll-smooth">
                        <Suspense fallback={<LoadingFallback />}>
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
                        </Suspense>
                    </main>
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

export default DashboardLayout;
