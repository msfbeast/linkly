import React, { useState, useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ViewState, LinkData } from '../types';
import TopNavigation from './TopNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import CreateLinkModal from './CreateLinkModal';
import LinkAnalytics from '../pages/LinkAnalytics';
import Settings from '../pages/Settings';
import { TrialCountdown } from './TrialCountdown';
import LoadingFallback from './LoadingFallback';
import TeamSettings from './teams/TeamSettings';
import { execute as retryExecute } from '../services/retryService';
import { toast } from 'sonner';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Links = React.lazy(() => import('../pages/Links'));
const BioDashboard = React.lazy(() => import('../pages/BioDashboard'));
const GlobalAnalytics = React.lazy(() => import('../pages/GlobalAnalytics'));
const ProductManager = React.lazy(() => import('../pages/ProductManager'));
const ApiPage = React.lazy(() => import('../pages/ApiPage'));
const AffiliateManager = React.lazy(() => import('../pages/AffiliateManager'));
const AgencyDashboard = React.lazy(() => import('../pages/AgencyDashboard'));
const AddProduct = React.lazy(() => import('../pages/AddProduct'));

const DashboardLayout: React.FC = () => {
    const { currentTeam } = useTeam();
    const { user } = useAuth(); // Added useAuth hook
    const navigate = useNavigate(); // Added useNavigate hook
    const location = useLocation(); // Added useLocation hook
    const [view, setView] = useState<ViewState>(() => {
        const path = window.location.pathname;
        if (path.includes('/team/settings')) return ViewState.TEAM_SETTINGS;
        if (path.includes('/settings')) return ViewState.SETTINGS;
        if (path.includes('/analytics')) return ViewState.ANALYTICS;
        if (path.includes('/products/add')) return ViewState.ADD_PRODUCT;
        if (path.includes('/products')) return ViewState.PRODUCTS;
        if (path.includes('/affiliate')) return ViewState.AFFILIATE;
        if (path.includes('/api')) return ViewState.API;
        if (path.includes('/bio')) return ViewState.BIO_PAGES;
        if (path.includes('/links')) return ViewState.LINKS;
        if (path.includes('/agency')) return ViewState.AGENCY;
        return ViewState.DASHBOARD;
    });
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
                // Pass currentTeam.id (or undefined/null for personal)
                const realLinks = await supabaseAdapter.getLinks(currentTeam?.id);
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
    }, [currentTeam]);

    // Sync view with URL
    useEffect(() => {
        const path = location.pathname;


        if (path.includes('/team/settings')) {
            setView(ViewState.TEAM_SETTINGS);
            setActiveSidebarItem('settings');
        } else if (path.includes('/products/add')) {
            setView(ViewState.ADD_PRODUCT);
            setActiveSidebarItem('products');
        } else if (path.includes('/products')) {
            setView(ViewState.PRODUCTS);
            setActiveSidebarItem('products');
        } else if (path.includes('/analytics')) {
            setView(ViewState.ANALYTICS);
            setActiveSidebarItem('analytics');
        } else if (path.includes('/products')) {
            setView(ViewState.PRODUCTS);
            setActiveSidebarItem('products');
        } else if (path.includes('/affiliate')) {
            setView(ViewState.AFFILIATE);
            setActiveSidebarItem('affiliate');
        } else if (path.includes('/agency')) {
            setView(ViewState.AGENCY);
            setActiveSidebarItem('agency');
        } else if (path === '/dashboard' || path === '/') {
            setView(ViewState.DASHBOARD);
            setActiveSidebarItem('dashboard');
        }
    }, [location.pathname]);

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

            // Cmd/Ctrl+K - Create new link (universal shortcut)
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
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
            case 'add_product':
                setView(ViewState.ADD_PRODUCT);
                break;
            case 'affiliate':
                setView(ViewState.AFFILIATE);
                break;
            case 'agency':
                setView(ViewState.AGENCY);
                break;
        }
    };

    const handleLinksUpdate = async () => {
        try {
            const realLinks = await supabaseAdapter.getLinks(currentTeam?.id);
            setLinks(realLinks);
        } catch (error) {
            console.error('Failed to refresh links:', error);
        }
    };

    const handleCreateLink = async (link: LinkData) => {
        try {
            await retryExecute(
                () => supabaseAdapter.createLink({ ...link, userId: user?.id, teamId: currentTeam?.id }),
                { maxRetries: 3, baseDelayMs: 1000 }
            );
            toast.success('Link created successfully!');
            await handleLinksUpdate();
            setIsModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
            toast.error(errorMessage);
            console.error('Failed to create link:', err);
        }
    };

    const handleBulkCreate = async (newLinks: LinkData[]) => {
        try {
            await Promise.all(
                newLinks.map((link) =>
                    retryExecute(
                        () => supabaseAdapter.createLink({ ...link, userId: user?.id, teamId: currentTeam?.id }),
                        { maxRetries: 3, baseDelayMs: 1000 }
                    )
                )
            );
            toast.success('Links created successfully!');
            await handleLinksUpdate();
            setIsModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create links';
            toast.error(errorMessage);
            console.error('Failed to bulk create links:', err);
        }
    };

    const handleUpdateLink = async (id: string, updates: Partial<LinkData>) => {
        // This is mainly for the modal if it needs it, though global create usually doesn't update
        try {
            await retryExecute(
                () => supabaseAdapter.updateLink(id, updates),
                { maxRetries: 3, baseDelayMs: 1000 }
            );
            await handleLinksUpdate();
        } catch (err) {
            console.error('Failed to update link:', err);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] text-slate-900 relative overflow-hidden">
            {/* Aurora Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-yellow-200/30 rounded-full blur-[100px] animate-pulse delay-1000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-pink-200/20 rounded-full blur-[120px] animate-pulse delay-2000" />
            </div>
            {/* Sidebar - Responsive */}
            <div>
                <Sidebar
                    currentView={view}
                    onChangeView={(newView) => {
                        // Agency is now handled internally, no need for special return
                        setView(newView);
                        // Update URL when view changes
                        const pathMap: Record<string, string> = {
                            [ViewState.DASHBOARD]: '/dashboard',
                            [ViewState.LINKS]: '/links',
                            [ViewState.ANALYTICS]: '/analytics',
                            [ViewState.SETTINGS]: '/settings',
                            [ViewState.PRODUCTS]: '/dashboard/products',
                            [ViewState.ADD_PRODUCT]: '/dashboard/products/add',
                            [ViewState.AFFILIATE]: '/affiliate',
                            [ViewState.BIO_PAGES]: '/bio',
                            [ViewState.API]: '/api-access',
                            [ViewState.TEAM_SETTINGS]: '/team/settings',
                            [ViewState.AGENCY]: '/agency'
                        };
                        if (pathMap[newView]) {
                            // Use navigate instead of manual pushState for better router sync
                            navigate(pathMap[newView]);
                        }
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                /></div>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-[300px] flex flex-col transition-all duration-300">
                {/* Top Navigation */}
                <TopNavigation
                    totalClicks={links.reduce((acc, link) => acc + (link.clicks || 0), 0)}
                    clickChange={clickChange}
                    onNewLinkClick={() => setIsModalOpen(true)}
                    onSettingsClick={() => setView(ViewState.SETTINGS)}
                    currentView={view}
                    onChangeView={setView}
                    onMenuClick={() => setIsSidebarOpen(true)}
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
                            {view === ViewState.ADD_PRODUCT && <AddProduct />}
                            {view === ViewState.AFFILIATE && <AffiliateManager />}
                            {view === ViewState.AGENCY && <AgencyDashboard />}
                            {view === ViewState.SETTINGS && <Settings />}
                            {view === ViewState.TEAM_SETTINGS && <TeamSettings />}
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
                                { key: '⌘K', action: 'Create new link' },
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
            {/* Global Create Link Modal */}
            <CreateLinkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateLink}
                onUpdate={handleUpdateLink}
                onBulkCreate={handleBulkCreate}
            />
        </div>
    );
};

export default DashboardLayout;
