// Dashboard v2.0 - Fixed infinite loop issue
const DASHBOARD_VERSION = '2.0.1'; // Force rebuild
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpRight, AlertCircle, Loader2, Link as LinkIcon, Download, Tag as TagIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CreateLinkModal from '../components/CreateLinkModal';
import { TagManager } from '../components/TagManager';
import { UpgradeModal } from '../components/UpgradeModal';
import QuickLinkInput from '../components/QuickLinkInput';
import { ErrorBoundary } from '../components/ErrorBoundary';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import AnalyticsOverview from '../components/dashboard/AnalyticsOverview';
import LinksList from '../components/dashboard/LinksList';
import { LinkData, categorizeLink, generateLinkHealthData, getTopPerformingLinks } from '../types';
import { calculateTrafficTotal } from '../components/TrafficSourceChart';
import { PriorityLink } from '../components/PriorityLinksList';
import { DateRange, generateClickForecastData, generateTrafficSourceData } from '../services/analyticsService';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { execute as retryExecute } from '../services/retryService';
import { exportAndDownload } from '../services/csvExportService';
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

  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Use external modal state if provided, otherwise use internal
  const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setIsModalOpen = setExternalModalOpen || setInternalModalOpen;

  // Load links from storage adapter with retry
  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedLinks = await retryExecute(
        () => supabaseAdapter.getLinks(),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      setLinks(storedLinks);

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
          };
          await retryExecute(
            () => supabaseAdapter.createLink(newLink),
            { maxRetries: 3, baseDelayMs: 1000 }
          );
          sessionStorage.removeItem('pending_link_url');
          // Reload links to show the new one
          const updatedLinks = await supabaseAdapter.getLinks();
          setLinks(updatedLinks);
        } catch (err) {
          console.error('Failed to create pending link:', err);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load links';
      setError(errorMessage);
      console.error('Failed to load links:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard: Loading links...');
    }
    loadLinks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateLink = async (link: LinkData) => {
    try {
      await retryExecute(
        () => supabaseAdapter.createLink(link),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMessage);
      console.error('Failed to create link:', err);
    }
  };

  const handleBulkCreate = async (newLinks: LinkData[]) => {
    try {
      await Promise.all(
        newLinks.map((link) =>
          retryExecute(
            () => supabaseAdapter.createLink(link),
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
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top 4 performing links for performance cards
  const topLinks = getTopPerformingLinks(links, 4);

  // Generate chart data with date range filtering
  const clickForecastData = generateClickForecastData(links, dateRange);
  const trafficSourceData = generateTrafficSourceData(links, dateRange);
  const trafficSourceTotal = calculateTrafficTotal(trafficSourceData);
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


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading your links...</p>
        </div>
      </div>
    );
  }

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

  // ... existing imports ...

  // ... inside component ...

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
            <QuickLinkInput onCreate={handleQuickCreate} isLoading={isLoading} />
          </div>

          {/* Analytics Overview (Bento Grid) */}
          {!hasNoLinks && (
            <ErrorBoundary>
              <AnalyticsOverview
                links={links}
                isLoading={isLoading}
                clickForecastData={clickForecastData}
                trafficSourceData={trafficSourceData}
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

            <ErrorBoundary>
              <LinksList
                links={links}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onDragEnd={handleDragEnd}
                onEdit={openEditModal}
                onDelete={handleDeleteLink}
                onCreateFirstLink={() => setIsModalOpen(true)}
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
