import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpRight, AlertCircle, Loader2, Link as LinkIcon, Wifi } from 'lucide-react';
import LinkCard from '../components/LinkCard';
import CreateLinkModal from '../components/CreateLinkModal';
import { LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { execute as retryExecute } from '../services/retryService';
import { subscribeToClickEvents, subscribeToLinkUpdates, RealtimeClickEvent, RealtimeLinkUpdate } from '../services/realtimeService';

interface LinksProps {
  externalModalOpen?: boolean;
  setExternalModalOpen?: (open: boolean) => void;
  onLinksUpdate?: () => void;
}

/**
 * Links Page - Dedicated page for managing all links
 * Shows a searchable list of links with create/edit/delete functionality
 */
const Links: React.FC<LinksProps> = ({
  externalModalOpen,
  setExternalModalOpen,
  onLinksUpdate,
}) => {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setIsModalOpen = setExternalModalOpen || setInternalModalOpen;

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('[Links] Setting up real-time subscriptions...');

    // Subscribe to new click events
    const unsubscribeClicks = subscribeToClickEvents((event: RealtimeClickEvent) => {
      console.log('[Links] Real-time click received:', event);
      setIsRealtimeConnected(true);

      // Update the link's click history in state
      setLinks(prevLinks =>
        prevLinks.map(link => {
          if (link.id === event.linkId) {
            return {
              ...link,
              clicks: link.clicks + 1,
              clickHistory: [event.click, ...link.clickHistory],
              lastClickedAt: event.click.timestamp,
            };
          }
          return link;
        })
      );
    });

    // Subscribe to link updates (click count changes)
    const unsubscribeLinks = subscribeToLinkUpdates((update: RealtimeLinkUpdate) => {
      console.log('[Links] Real-time link update received:', update);
      setIsRealtimeConnected(true);

      // Update the link's click count in state
      setLinks(prevLinks =>
        prevLinks.map(link => {
          if (link.id === update.linkId) {
            return {
              ...link,
              clicks: update.clicks,
              lastClickedAt: update.lastClickedAt,
            };
          }
          return link;
        })
      );
    });

    // Mark as connected after a short delay
    const connectionTimer = setTimeout(() => {
      setIsRealtimeConnected(true);
    }, 2000);

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[Links] Cleaning up real-time subscriptions...');
      unsubscribeClicks();
      unsubscribeLinks();
      clearTimeout(connectionTimer);
    };
  }, []);


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
    link.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading your links...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load links</h2>
          <p className="text-stone-500 mb-6">{error}</p>
          <button
            onClick={loadLinks}
            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-sm shadow-yellow-400/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Links</h1>
              {isRealtimeConnected && (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Live</span>
                </span>
              )}
            </div>
            <p className="text-stone-500 text-sm mt-1">
              {links.length} {links.length === 1 ? 'link' : 'links'} total
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-sm shadow-yellow-400/20"
          >
            <Plus className="w-5 h-5" />
            Create Link
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400 group-focus-within:text-yellow-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by title, short code, or URL..."
            className="w-full bg-white border border-stone-200 text-slate-900 pl-12 pr-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all placeholder:text-stone-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Links List */}
        <div className="bg-white border border-stone-200 rounded-[2rem] p-6 shadow-sm">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <LinkCard
                      link={link}
                      onDelete={handleDeleteLink}
                      onEdit={openEditModal}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-200">
                    {searchTerm ? (
                      <Search className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <LinkIcon className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {searchTerm ? 'No links found' : 'No links yet'}
                  </h3>
                  <p className="text-stone-500 mb-4 max-w-sm mx-auto text-sm">
                    {searchTerm
                      ? 'Try a different search term.'
                      : 'Create your first shortened link to get started.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-yellow-600 hover:text-yellow-700 font-bold flex items-center justify-center gap-2 mx-auto text-sm"
                    >
                      Create your first link <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

export default Links;
