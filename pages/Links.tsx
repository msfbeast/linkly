import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ArrowUpRight, AlertCircle, Loader2, Link as LinkIcon, Wifi, Upload, Copy } from 'lucide-react';
import { toast } from 'sonner';
import LinkCard from '../components/LinkCard';
import SmartLinkCard from '../components/SmartLinkCard';
import CreateLinkModal from '../components/CreateLinkModal';
import { FolderTree } from '../components/FolderTree';
import { useAuth } from '../contexts/AuthContext';
import { BulkActionsModal } from '../components/BulkActionsModal';
import { LinkData, Folder } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { execute as retryExecute } from '../services/retryService';
import { subscribeToClickEvents, subscribeToLinkUpdates, RealtimeClickEvent, RealtimeLinkUpdate } from '../services/realtimeService';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { TagManager } from '../components/TagManager';

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
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false); // Add state

  const isModalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setIsModalOpen = setExternalModalOpen || setInternalModalOpen;

  // ... existing code ...

  <div className="flex gap-2">
    <button
      onClick={() => setIsBulkImportOpen(true)}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-slate-900 font-bold rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
    >
      <Upload className="w-5 h-5" />
      Import
    </button>
    <button
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-sm shadow-yellow-400/20"
    >
      <Plus className="w-5 h-5" />
      Create Link
    </button>
  </div>

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [storedLinks, storedFolders] = await Promise.all([
        retryExecute(() => supabaseAdapter.getLinks(), { maxRetries: 3, baseDelayMs: 1000 }),
        user ? retryExecute(() => supabaseAdapter.getFolders(user.id), { maxRetries: 3, baseDelayMs: 1000 }) : Promise.resolve([])
      ]);

      setLinks(storedLinks);
      setFolders(storedFolders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {


    // Subscribe to new click events
    const unsubscribeClicks = subscribeToClickEvents((event: RealtimeClickEvent) => {

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

      unsubscribeClicks();
      unsubscribeLinks();
      clearTimeout(connectionTimer);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // --- Folder Operations ---

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!user) return;
    try {
      const newFolder = await supabaseAdapter.createFolder({
        userId: user.id,
        name,
        parentId,
      });
      setFolders(prev => [...prev, newFolder]);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      await supabaseAdapter.updateFolder(id, { name });
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await supabaseAdapter.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(null);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    // Prevent moving folder into itself or its children
    if (folderId === newParentId) return;

    // Check if newParentId is a child of folderId
    let current = folders.find(f => f.id === newParentId);
    while (current) {
      if (current.id === folderId) return; // Cycle detected
      current = folders.find(f => f.id === current?.parentId);
    }

    try {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: newParentId } : f));
      await supabaseAdapter.moveFolder(folderId, newParentId);
    } catch (error) {
      console.error('Failed to move folder:', error);
      loadData(); // Revert
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Case 1: Dragging a Folder
    if (active.data.current?.type === 'FOLDER') {
      if (activeId !== overId) {
        if (over.data.current?.type === 'FOLDER') {
          handleMoveFolder(activeId, overId);
        } else if (overId === 'root') {
          handleMoveFolder(activeId, null);
        }
      }
      return;
    }

    // Case 2: Dragging a Link (to a folder)
    if (over && activeId !== overId) {
      // Check if dropped on a folder
      const isFolder = folders.some(f => f.id === overId) || overId === 'root';

      if (isFolder) {
        const folderId = overId === 'root' ? null : overId;

        // Optimistic update
        setLinks(prevLinks => prevLinks.map(link =>
          link.id === activeId ? { ...link, folderId } : link
        ));

        try {
          await supabaseAdapter.updateLink(activeId, { folderId });
        } catch (error) {
          console.error('Failed to move link:', error);
          loadData(); // Revert
        }
      }
    }
  };


  const handleCreateLink = async (link: LinkData) => {
    try {
      await retryExecute(
        () => supabaseAdapter.createLink(link),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      await loadData();
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
      await loadData();
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
      await loadData();
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
      await loadData();
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

  const handleDuplicate = async (link: LinkData) => {
    try {
      const duplicatedLink: LinkData = {
        ...link,
        id: crypto.randomUUID(),
        shortCode: Math.random().toString(36).substring(2, 8),
        title: `${link.title} (Copy)`,
        clicks: 0,
        createdAt: Date.now(),
        userId: user?.id,
        // Keep other data same
      };

      await retryExecute(
        () => supabaseAdapter.createLink(duplicatedLink),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Link duplicated successfully!');
      await loadData();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate link';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = (link.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.shortCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.originalUrl || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFolder = selectedFolderId === null
      ? true
      : link.folderId === selectedFolderId;

    return matchesSearch && matchesFolder;
  });

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
            onClick={loadData}
            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-sm shadow-yellow-400/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[#FDFBF7] flex">
        {/* Folder Sidebar */}
        <div className="w-64 border-r border-stone-200 bg-white p-4 hidden md:block h-screen sticky top-0 overflow-y-auto">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveFolder={handleMoveFolder}
          />
        </div>

        <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
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

          {/* Search and Tag Manager */}
          <div className="flex gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400 group-focus-within:text-yellow-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by title, short code, or URL..."
                className="w-full bg-white border border-stone-200 text-slate-900 pl-12 pr-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all placeholder:text-stone-400 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsTagManagerOpen(true)}
              className="px-4 py-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              Manage Tags
            </button>
          </div>

          {/* Links List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <LinkCard
                      link={link}
                      onDelete={handleDeleteLink}
                      onEdit={openEditModal}
                      onDuplicate={handleDuplicate}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-[2rem] border border-stone-200"
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

        <CreateLinkModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreate={handleCreateLink}
          onUpdate={handleUpdateLink}
          onBulkCreate={handleBulkCreate}
          editingLink={editingLink}
        />

        <BulkActionsModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={() => {
            loadData();
            onLinksUpdate?.();
          }}
        />

        <TagManager
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          userId={user?.id || ''}
          onTagsUpdate={() => {
            // Optionally refresh links if tags changed significantly
            loadData();
          }}
        />
      </div>
    </DndContext>
  );
};

export default Links;
