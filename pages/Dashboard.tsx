// Dashboard v2.0 - Fixed infinite loop issue
const DASHBOARD_VERSION = '2.0.1'; // Force rebuild
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpRight, AlertCircle, Loader2, Link as LinkIcon, Download, Tag as TagIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext'; // Added in Step 2, ensuring it's here
import CreateLinkModal from '../components/CreateLinkModal';
import { TagManager } from '../components/TagManager';
import { UpgradeModal } from '../components/UpgradeModal';
import QuickLinkInput from '../components/QuickLinkInput';
import HeroCreateButton from '../components/HeroCreateButton';
import { ErrorBoundary } from '../components/ErrorBoundary';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import AnalyticsOverview from '../components/dashboard/AnalyticsOverview';
import LinksList from '../components/dashboard/LinksList';
import { LinkData, categorizeLink, generateLinkHealthData, getTopPerformingLinks } from '../types';
import { calculateTrafficTotal } from '../components/TrafficSourceChart';
import { PriorityLink } from '../components/PriorityLinksList';
import { DateRange, generateClickForecastData, generateTrafficSourceData } from '../services/analyticsService';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { aggregatedAnalytics, UserClickStats, CityBreakdown } from '../services/aggregatedAnalyticsService';
import { execute as retryExecute } from '../services/retryService';
import { exportAndDownload } from '../services/csvExportService';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface DashboardProps {
  externalModalOpen?: boolean;
  setExternalModalOpen?: (open: boolean) => void;
  onLinksUpdate?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  externalModalOpen,
  setExternalModalOpen,
  onLinksUpdate,
}) => {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [userClickStats, setUserClickStats] = useState<UserClickStats | null>(null);
  const [serverCityData, setServerCityData] = useState<CityBreakdown[]>([]);
  const [serverOsData, setServerOsData] = useState<any[]>([]);
  const [serverBrowserData, setServerBrowserData] = useState<any[]>([]);
  const [serverReferrerData, setServerReferrerData] = useState<any[]>([]);
  const [serverClickForecast, setServerClickForecast] = useState<any[] | null>(null);
  const [serverTrafficSource, setServerTrafficSource] = useState<any[] | null>(null);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [priorityLinksChecked, setPriorityLinksChecked] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'limit_reached' | 'custom_domain' | 'analytics' | 'general'>('general');
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');

  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const navigate = useNavigate();

  // Use external modal state if provided, otherwise use internal
  const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setIsModalOpen = setExternalModalOpen || setInternalModalOpen;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = links.findIndex((item) => item.id === active.id);
      const newIndex = links.findIndex((item) => item.id === over?.id);

      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      // Persist the new order
      const linkIds = newLinks.map(l => l.id);
      supabaseAdapter.updateLinkOrder(linkIds).catch(err => {
        console.error('Failed to update link order:', err);
      });
    }
  };

  // Load links from storage adapter with retry
  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass filterStatus to getLinks
      const fetchedLinks = await retryExecute(
        () => supabaseAdapter.getLinks(currentTeam?.id, { archived: filterStatus === 'archived' }),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      setLinks(fetchedLinks);

      // Calculate server-side stats from fetched links (or fetch separate stats if needed)
      // Check for pending link from landing page
      const pendingLinkUrl = sessionStorage.getItem('pending_link_url');
      if (pendingLinkUrl) {
        try {
          const newLink: Omit<LinkData, 'id'> = {
            originalUrl: pendingLinkUrl,
            shortCode: '', // Let backend generate it
            title: new URL(pendingLinkUrl).hostname,
            createdAt: Date.now(),
            clicks: 0,
            tags: [],
            clickHistory: [],
            teamId: currentTeam?.id
          };
          await retryExecute(
            () => supabaseAdapter.createLink(newLink),
            { maxRetries: 3, baseDelayMs: 1000 }
          );
          sessionStorage.removeItem('pending_link_url');
          // Reload links to show the new one
          const updatedLinks = await retryExecute(
            () => supabaseAdapter.getLinks(currentTeam?.id),
            { maxRetries: 3, baseDelayMs: 1000 }
          );
          setLinks(updatedLinks);
        } catch (err) {
          console.error('Failed to create pending link:', err);
        }
      }

      // Load Analytics Async (Server-Side)
      if (user?.id) {
        try {
          const fullAnalytics = await aggregatedAnalytics.getFullAnalytics(user.id);

          // Update Stats
          if (fullAnalytics.stats) setUserClickStats(fullAnalytics.stats);
          // Fallback for unique visitors if RPC fails:
          // const uniqueVisitors = fullAnalytics.stats?.uniqueVisitors || 0; 

          // Update Charts
          if (fullAnalytics.cities) setServerCityData(fullAnalytics.cities);
          if (fullAnalytics.devices) setServerBrowserData(fullAnalytics.devices); // Map devices to browser chart area or similar
          if (fullAnalytics.referrers) {
            setServerReferrerData(fullAnalytics.referrers);

            // Map referrers to Traffic Source Data (Donut Chart)
            const sourceCounts: any = { direct: 0, social: 0, referral: 0 };
            fullAnalytics.referrers.forEach((r: any) => {
              const ref = (r.referrer || '').toLowerCase();
              if (!ref || ref === 'direct' || ref === 'unknown') sourceCounts.direct += r.clickCount;
              else if (['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'].some(s => ref.includes(s))) sourceCounts.social += r.clickCount;
              else sourceCounts.referral += r.clickCount;
            });
            setServerTrafficSource([
              { name: 'Direct', value: sourceCounts.direct, color: '#00d4ff' },
              { name: 'Social', value: sourceCounts.social, color: '#a855f7' },
              { name: 'Referral', value: sourceCounts.referral, color: '#ff6b6b' }
            ]);
          }

          if (fullAnalytics.clicksOverTime) {
            // Map clicksOverTime to Click Forecast Data (Bar Chart)
            // We need to map dates to Days of Week
            const daysMap: any = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            fullAnalytics.clicksOverTime.forEach((c: any) => {
              const d = new Date(c.date);
              const dayName = days[d.getDay()];
              daysMap[dayName] = (daysMap[dayName] || 0) + c.clickCount;
            });

            // Calculate average for faux forecast
            const total = Object.values(daysMap).reduce((a: any, b: any) => a + b, 0) as number;
            const avg = total / 7;

            setServerClickForecast(Object.entries(daysMap).map(([day, val]) => ({
              date: day,
              actual: val,
              forecast: Math.round(avg * (0.8 + Math.random() * 0.4))
            })));
          }

          // OS Data (if available)
          // if (fullAnalytics.os) setServerOsData(fullAnalytics.os);

        } catch (analyticsErr) {
          console.error('Failed to load background analytics', analyticsErr);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load links';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentTeam?.id, filterStatus]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard: Loading links...');
    }
    loadLinks();
  }, [user, currentTeam, filterStatus]); // Add filterStatus dependency

  const handleCreateLink = async (link: LinkData) => {
    try {
      const result = await retryExecute(
        () => supabaseAdapter.createLink({ ...link, teamId: currentTeam?.id }),
        { maxRetries: 3, baseDelayMs: 1000 }
      ) as LinkData & { _isExisting?: boolean };

      // Show appropriate toast
      if (result._isExisting) {
        toast.info('Link already exists! Showing your existing short link.', {
          duration: 4000,
        });
      } else {
        toast.success('Link created successfully!');
      }

      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to create link:', err);
    }
  };

  const handleBulkCreate = async (newLinks: LinkData[]) => {
    try {
      await Promise.all(
        newLinks.map((link) =>
          retryExecute(
            () => supabaseAdapter.createLink({ ...link, teamId: currentTeam?.id }),
            { maxRetries: 3, baseDelayMs: 1000 }
          )
        )
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create links';
      setError(errorMessage);
      console.error('Failed to bulk create links:', err);
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinkData>) => {
    try {
      await retryExecute(
        () => supabaseAdapter.updateLink(id, updates),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update link';
      setError(errorMessage);
      console.error('Failed to update link:', err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await retryExecute(
        () => supabaseAdapter.deleteLink(id),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link';
      setError(errorMessage);
      console.error('Failed to delete link:', err);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(id =>
          retryExecute(
            () => supabaseAdapter.deleteLink(id),
            { maxRetries: 3, baseDelayMs: 1000 }
          )
        )
      );
      toast.success(`Deleted ${ids.length} link${ids.length > 1 ? 's' : ''}`);
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete links';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to bulk delete links:', err);
    }
  };

  const handleDuplicateLink = async (link: LinkData) => {
    try {
      // Create a copy with reset stats
      const duplicatedLink: Omit<LinkData, 'id'> = {
        originalUrl: link.originalUrl,
        shortCode: '', // Let backend generate new code
        title: `${link.title} (Copy)`,
        description: link.description,
        tags: link.tags,
        createdAt: Date.now(),
        clicks: 0,
        clickHistory: [],
        teamId: currentTeam?.id,
        // Copy advanced settings
        smartRedirects: link.smartRedirects,
        geoRedirects: link.geoRedirects,
        password: link.password,
        expirationDate: link.expirationDate,
        startDate: link.startDate,
      };

      await retryExecute(
        () => supabaseAdapter.createLink(duplicatedLink),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Link duplicated successfully!');
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate link';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to duplicate link:', err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await retryExecute(
        () => supabaseAdapter.exportAllData(),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      exportAndDownload(exportData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const openEditModal = (link: LinkData) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const filteredLinks = links.filter(link =>
    (link.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.shortCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (link.originalUrl || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top 4 performing links for performance cards
  const topLinks = getTopPerformingLinks(links, 4);

  // topLinks calc ok client side (clicks are on link object)

  // Generate chart data with date range filtering
  // Use serve-side data if available, else fallback to client generation (likely empty now)
  const clickForecastData = serverClickForecast || generateClickForecastData(links, dateRange);
  const trafficSourceData = serverTrafficSource || generateTrafficSourceData(links, dateRange);
  // Use aggregated total if available (not capped), otherwise fall back to calculated total
  // Use aggregated total if available (not capped), otherwise fall back to calculated total
  const trafficSourceTotal = userClickStats?.totalClicks ?? calculateTrafficTotal(trafficSourceData);
  const linkHealthData = generateLinkHealthData(links);

  // Generate priority links from links that need attention
  const priorityLinks: PriorityLink[] = links
    .filter(link => {
      // Links expiring soon (within 7 days)
      if (link.expirationDate && link.expirationDate - Date.now() < 7 * 24 * 60 * 60 * 1000) {
        return true;
      }
      // Links with low clicks (potential low CTR)
      if (link.clicks < 5 && Date.now() - link.createdAt > 3 * 24 * 60 * 60 * 1000) {
        return true;
      }
      // Recently active links
      if (link.lastClickedAt && Date.now() - link.lastClickedAt < 24 * 60 * 60 * 1000) {
        return true;
      }
      return false;
    })
    .slice(0, 5)
    .map(link => {
      let status: 'active' | 'expiring' | 'low-ctr' = 'active';
      if (link.expirationDate && link.expirationDate - Date.now() < 7 * 24 * 60 * 60 * 1000) {
        status = 'expiring';
      } else if (link.clicks < 5 && Date.now() - link.createdAt > 3 * 24 * 60 * 60 * 1000) {
        status = 'low-ctr';
      }

      const lastClickedAt = link.lastClickedAt
        ? formatTimeAgo(link.lastClickedAt)
        : 'Never';

      return {
        id: link.id,
        title: link.title,
        shortCode: link.shortCode,
        lastClickedAt,
        status,
        checked: priorityLinksChecked[link.id] || false,
      };
    });

  const handlePriorityLinkToggle = (id: string) => {
    setPriorityLinksChecked(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Format date for display
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Format time ago
  function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }


  // Loading state handled within components now
  // if (isLoading) { ... }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load data</h2>
          <p className="text-stone-500 mb-6">{error}</p>
          <button
            onClick={loadLinks}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Quick Link Creation Handler
  const handleQuickCreate = async (url: string) => {
    try {
      // Create link with default settings
      const newLink: Omit<LinkData, 'id'> = {
        originalUrl: url,
        shortCode: '', // Let backend generate it
        title: new URL(url).hostname, // Default title
        createdAt: Date.now(),
        clicks: 0,
        tags: [],
        clickHistory: [],
        teamId: currentTeam?.id,
      };

      await retryExecute(
        () => supabaseAdapter.createLink(newLink),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      console.error('Failed to quick create link:', err);
    }
  };

  // Empty state - no links exist
  const hasNoLinks = links.length === 0;





  // Check link limit
  const handleCreateClick = () => {
    const isFreePlan = user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier;
    const linkCount = links.length;

    if (isFreePlan && linkCount >= 50) {
      setUpgradeTrigger('limit_reached');
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsModalOpen(true);
  };

  const handleArchiveLink = async (id: string) => {
    try {
      await retryExecute(
        () => supabaseAdapter.archiveLink(id),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
      toast.success('Link archived successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive link';
      setError(errorMessage);
      console.error('Failed to archive link:', err);
    }
  };

  const handleRestoreLink = async (id: string) => {
    try {
      await retryExecute(
        () => supabaseAdapter.restoreLink(id),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
      toast.success('Link restored successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore link';
      setError(errorMessage);
      console.error('Failed to restore link:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] transition-all duration-300 relative overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-yellow-200/40 via-purple-200/40 to-transparent blur-3xl -z-10 rounded-full opacity-60 pointer-events-none" />

      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        userId={user?.id || ''}
        onTagsUpdate={loadLinks}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        trigger={upgradeTrigger}
      />

      <div className="w-full pr-8">
        <div className="p-6 max-w-7xl mx-auto space-y-8">

          {/* Header Section */}
          <DashboardHeader
            user={user}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onExport={handleExport}
            isExporting={isExporting}
          />

          {/* Hero Input */}
          <div className="relative z-10 max-w-3xl mx-auto mb-12">
            <HeroCreateButton onClick={handleCreateClick} />
          </div>

          {/* Analytics Overview (Bento Grid) */}
          {/* Analytics Overview (Bento Grid) */}
          {(isLoading || !hasNoLinks) && (
            <ErrorBoundary>
              <AnalyticsOverview
                links={links}
                isLoading={isLoading}
                clickForecastData={clickForecastData}
                trafficSourceData={trafficSourceData}
                totalClicks={trafficSourceTotal}
                serverCityData={serverCityData}
                serverOsData={serverOsData}
                serverBrowserData={serverBrowserData}
                serverReferrerData={serverReferrerData}
              />
            </ErrorBoundary>
          )}

          {/* Links List Section */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Links</h2>
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-slate-900 hover:border-stone-300 transition-all shadow-sm"
              >
                <TagIcon className="w-4 h-4" />
                <span>Manage Tags</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'active'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
              >
                Active Links
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'archived'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'bg-white text-stone-500 hover:bg-stone-50'
                  }`}
              >
                Archived
              </button>
            </div>

            <ErrorBoundary>
              <LinksList
                links={links}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onDragEnd={handleDragEnd}
                onEdit={openEditModal}
                onDelete={handleDeleteLink}
                onArchive={filterStatus === 'active' ? handleArchiveLink : undefined}
                onRestore={filterStatus === 'archived' ? handleRestoreLink : undefined}
                onBulkDelete={handleBulkDelete}
                onDuplicate={handleDuplicateLink}
                onCreateFirstLink={() => setIsModalOpen(true)}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          </div>

        </div>
      </div>

      <CreateLinkModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateLink}
        onUpdate={handleUpdateLink}
        onBulkCreate={handleBulkCreate}
        editingLink={editingLink}
      />
    </div>
  );
};

export default Dashboard;
