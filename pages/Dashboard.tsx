import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpRight, AlertCircle, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import LinkCard from '../components/LinkCard';
import SmartLinkCard from '../components/SmartLinkCard';
import CreateLinkModal from '../components/CreateLinkModal';
import LinkPerformanceCard from '../components/LinkPerformanceCard';
import ClickForecastChart from '../components/ClickForecastChart';
import TrafficSourceChart, { calculateTrafficTotal } from '../components/TrafficSourceChart';
import LinkHealthChart from '../components/LinkHealthChart';
import PriorityLinksList, { PriorityLink } from '../components/PriorityLinksList';
import DateRangeSelector from '../components/DateRangeSelector';
import { LinkData, categorizeLink, generateLinkHealthData, getTopPerformingLinks } from '../types';
import { DateRange, generateClickForecastData, generateTrafficSourceData } from '../services/analyticsService';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { execute as retryExecute } from '../services/retryService';
import { exportAndDownload } from '../services/csvExportService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [priorityLinksChecked, setPriorityLinksChecked] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

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
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          onRetry: (attempt, err) => {
            console.warn(`Retry attempt ${attempt} for loading links:`, err.message);
          },
        }
      );
      setLinks(storedLinks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load links';
      setError(errorMessage);
      console.error('Failed to load links:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

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

  // Empty state - no links exist
  const hasNoLinks = links.length === 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] transition-all duration-300">
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Empty State - Show when no links exist */}
        {hasNoLinks ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-yellow-100/50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/10">
              <LinkIcon className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Welcome to Gather!</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto text-lg">
              Create your first shortened link to start tracking clicks and analyzing your traffic.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create Your First Link
            </button>
          </motion.div>
        ) : (
          <>
            {/* Link Performance Cards Row - Top 4 Links */}
            {topLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                data-testid="link-cards-row"
              >
                {topLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <SmartLinkCard
                      link={link}
                      onDelete={handleDeleteLink}
                      onEdit={openEditModal}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Date Range Filter and Export */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex justify-end items-center gap-3"
            >
              <DateRangeSelector
                selectedRange={dateRange}
                onRangeChange={setDateRange}
              />
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:border-slate-300 text-stone-600 hover:text-slate-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                title="Export all data as CSV"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isExporting ? 'Exporting...' : 'Export'}
                </span>
              </button>
            </motion.div>

            {/* Charts Row - Click Forecast and Traffic Source */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2">
                <ClickForecastChart data={clickForecastData} />
              </div>
              <div>
                <TrafficSourceChart data={trafficSourceData} total={trafficSourceTotal} />
              </div>
            </motion.div>

            {/* Bottom Row - Link Health and Priority Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <LinkHealthChart data={linkHealthData} />
              <PriorityLinksList
                links={priorityLinks}
                onLinkToggle={handlePriorityLinkToggle}
                onViewAll={() => { }}
              />
            </motion.div>

            {/* Links List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
              <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Your Links</h2>

              <div className="relative group">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Search links..."
                  className="bg-white border border-stone-200 text-slate-900 pl-12 pr-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-full md:w-80 transition-all placeholder:text-stone-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Links List */}
            <div className="bg-white border border-stone-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider">All Links</h3>
                <span className="px-3 py-1 bg-stone-100 rounded-full text-stone-600 text-xs font-medium">{filteredLinks.length} links</span>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredLinks.length > 0 ? (
                    filteredLinks.map((link, index) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <LinkCard
                          link={link}
                          onDelete={handleDeleteLink}
                          onEdit={openEditModal}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-stone-50/50 border border-stone-200 rounded-3xl border-dashed">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-stone-100">
                        <Search className="w-6 h-6 text-stone-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">No links found</h3>
                      <p className="text-stone-500 mb-6 max-w-sm mx-auto text-sm">
                        {searchTerm ? 'Try a different search term.' : 'Get started by creating your first shortened link.'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="text-slate-900 hover:text-slate-700 font-bold flex items-center justify-center gap-2 mx-auto text-sm bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all"
                        >
                          Create your first link <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
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
