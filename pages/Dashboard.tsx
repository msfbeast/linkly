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
import { ErrorBoundary } from '../components/ErrorBoundary';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import OverviewBento from '../components/dashboard/OverviewBento';
import LinksList from '../components/dashboard/LinksList';
import { LinkData, categorizeLink } from '../types'; // generateLinkHealthData, getTopPerformingLinks moved to analyticsService
import { PriorityLink } from '../components/PriorityLinksList';
import { DateRange, generateClickForecastData, generateTrafficSourceData, generateLinkHealthData, getTopPerformingLinks } from '../services/analyticsService';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { titleFromUrl } from '../utils/urlTitle';
import { execute as retryExecute } from '../services/retryService';
import { exportAndDownload } from '../services/csvExportService';
import { toast } from 'sonner';
import { newShortCode } from '../utils/shortCode';
import { FREE_LINK_LIMIT } from '../utils/planLimits';
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
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');
  const [totalClicks, setTotalClicks] = useState(0);

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
      // Check for pending link from landing page
      const pendingLinkUrl = sessionStorage.getItem('pending_link_url');
      if (pendingLinkUrl) {
        try {
          const newLink: Omit<LinkData, 'id'> = {
            originalUrl: pendingLinkUrl,
            shortCode: newShortCode(), // the database doesn't make one
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
        } catch (err) {
          console.error('Failed to create pending link:', err);
        }
      }

      // Fetch links (Optimized: No analytics/click history)
      const data = await retryExecute(
        () => supabaseAdapter.getLinks(currentTeam?.id || null, { archived: filterStatus === 'archived', includeAnalytics: false }),
        { maxRetries: 3, baseDelayMs: 1000 }
      );

      if (data) {
        setLinks(data);

        // Calculate basic stats from link columns (not history)
        const total = data.reduce((sum, link) => sum + link.clicks, 0);
        setTotalClicks(total);

        // The click overview (OverviewBento) loads its own data.
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load links';
      setError(errorMessage);
      console.error('Failed to load links:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentTeam?.id, filterStatus]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
    loadLinks();
  }, [user, currentTeam, filterStatus]); // Add filterStatus dependency

  const handleCreateLink = async (link: LinkData): Promise<void> => {
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
      toast.error(errorMessage);
      console.error('Failed to create link:', err);
      throw err;
    }
  };

  const handleBulkCreate = async (newLinks: LinkData[]): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.bulkCreateLinks(
          newLinks.map(link => ({ ...link, teamId: currentTeam?.id })) as any[]
        ),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create links';
      toast.error(errorMessage);
      console.error('Failed to bulk create links:', err);
      throw err;
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinkData>): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.updateLink(id, updates),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update link';
      toast.error(errorMessage);
      console.error('Failed to update link:', err);
      throw err;
    }
  };

  const handleDeleteLink = async (id: string): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.deleteLink(id),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Link deleted successfully');
      await loadLinks();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link';
      toast.error(errorMessage);
      console.error('Failed to delete link:', err);
    }
  };

  const handleBulkDelete = async (ids: string[]): Promise<void> => {
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
      toast.error(errorMessage);
      console.error('Failed to bulk delete links:', err);
    }
  };

  const handleDuplicateLink = async (link: LinkData): Promise<void> => {
    try {
      // Create a copy with reset stats
      const duplicatedLink: Omit<LinkData, 'id'> = {
        originalUrl: link.originalUrl,
        shortCode: newShortCode(),
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
        userId: user?.id,
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
      toast.error(errorMessage);
      console.error('Failed to duplicate link:', err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Pages are retried individually inside exportAllData; retrying the
      // whole export would download everything again.
      const exportData = await supabaseAdapter.exportAllData();
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

  // Get top performing links for performance cards
  const topLinks = getTopPerformingLinks(links);

  // Derived metrics
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

  // Quick create from the paste box: default settings, short code from the backend.
  const handleQuickCreate = async (url: string) => {
    const isFreePlan = user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier;
    if (isFreePlan && links.length >= FREE_LINK_LIMIT) {
      setUpgradeTrigger('limit_reached');
      setIsUpgradeModalOpen(true);
      return;
    }
    try {
      const newLink: Omit<LinkData, 'id'> = {
        originalUrl: url,
        shortCode: newShortCode(), // the database doesn't make one
        title: titleFromUrl(url), // Readable default from the URL slug
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
      toast.success('Short link created');
    } catch (err) {
      console.error('Failed to quick create link:', err);
      toast.error(err instanceof Error ? err.message : 'Could not create the link');
      throw err; // keep the pasted URL in the box
    }
  };

  // Empty state - no links exist
  const hasNoLinks = links.length === 0;





  // Check link limit
  const handleCreateClick = () => {
    const isFreePlan = user?.preferences?.subscription_tier === 'free' || !user?.preferences?.subscription_tier;
    const linkCount = links.length;

    if (isFreePlan && linkCount >= FREE_LINK_LIMIT) {
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
    <div className="min-h-screen bg-[#ECEBE7]">

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

      <div className="w-full">
        <div className="mx-auto max-w-7xl space-y-3.5 px-4 pb-16 sm:px-6">

          {/* Header Section */}
          <DashboardHeader
            user={user}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onExport={handleExport}
            isExporting={isExporting}
          />

          {/* Paste a link to shorten it */}
          <QuickLinkInput onCreate={handleQuickCreate} onMoreOptions={handleCreateClick} />

          {/* Click overview (personal links; team analytics aren't available yet) */}
          {user?.id && !currentTeam && !hasNoLinks && (
            <ErrorBoundary>
              <OverviewBento userId={user.id} dateRange={dateRange} linkCount={links.length} />
            </ErrorBoundary>
          )}

          {/* Links List Section */}
          <div className="rounded-3xl bg-[#FBFAF8] p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-[#8C8981]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[#FF5A14]" />
                <h2 className="text-[13px] font-normal">Your links</h2>
              </div>
              <div className="flex items-center gap-2">
                <div role="group" aria-label="Show links" className="flex items-center gap-0.5 rounded-full bg-[#F0EEEA] p-1">
                  {(['active', 'archived'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      aria-pressed={filterStatus === status}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium capitalize transition-colors ${filterStatus === status
                        ? 'bg-[#18181A] text-[#F2F1EE]'
                        : 'text-[#6E6B65] hover:text-[#18181A]'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsTagManagerOpen(true)}
                  data-tour="tag-filter"
                  className="flex h-[34px] items-center gap-2 rounded-full bg-[#F0EEEA] px-3.5 text-[12px] font-medium text-[#4A4843] transition-colors hover:text-[#18181A]"
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  <span>Tags</span>
                </button>
              </div>
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
