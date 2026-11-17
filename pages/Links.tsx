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


  const handleCreateLink = async (link: LinkData): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.createLink(link),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Link created successfully!');
      await loadData();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create link';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleBulkCreate = async (newLinks: LinkData[]): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.bulkCreateLinks(newLinks as any[]),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Links created successfully!');
      await loadData();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create links';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinkData>): Promise<void> => {
    try {
      await retryExecute(
        () => supabaseAdapter.updateLink(id, updates),
        { maxRetries: 3, baseDelayMs: 1000 }
      );
      toast.success('Link updated successfully!');
      await loadData();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update link';
      toast.error(errorMessage);
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
      await loadData();
      onLinksUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete link';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (link: LinkData) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (link: LinkData): Promise<void> => {
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
      <div className="min-h-screen bg-[#ECEBE7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#8C8981]" />
          <p className="text-stone-500">Loading your links...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#ECEBE7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load links</h2>
          <p className="text-stone-500 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="rounded-full bg-[#18181A] px-5 py-2.5 text-[13px] font-semibold text-[#F2F1EE] hover:bg-[#2B2B2E]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="mx-auto flex min-h-screen max-w-7xl items-start gap-3.5 px-4 pb-16 sm:px-6">
        {/* Folders */}
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 overflow-y-auto rounded-3xl bg-[#FBFAF8] p-4 md:block">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveFolder={handleMoveFolder}
          />
        </aside>

        <div className="min-w-0 flex-1 space-y-3.5">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-2 pt-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[clamp(26px,3vw,34px)] font-semibold leading-tight tracking-[-0.02em] text-[#18181A]">Links</h1>
                {isRealtimeConnected && (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#FBFAF8] px-2.5 py-1 font-mono text-[11px] text-[#8C8981]" title="Click counts update as they happen">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    live
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#8C8981]">
                {filteredLinks.length === links.length
                  ? `${links.length.toLocaleString('en-IN')} ${links.length === 1 ? 'link' : 'links'}`
                  : `${filteredLinks.length.toLocaleString('en-IN')} of ${links.length.toLocaleString('en-IN')} links`}
              </p>
            </div>
          </div>

          {/* Search and tags */}
          <div className="flex gap-2 rounded-3xl bg-[#FBFAF8] p-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A19E97]" />
              <label htmlFor="links-search" className="sr-only">Search links</label>
              <input
                id="links-search"
                type="text"
                placeholder="Search by title, short code or URL"
                className="w-full rounded-2xl border-none bg-transparent py-2.5 pl-11 pr-4 text-[14px] text-[#18181A] placeholder:text-[#A19E97] focus:outline-none focus:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsTagManagerOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-full bg-[#F0EEEA] px-4 text-[13px] font-medium text-[#4A4843] transition-colors hover:text-[#18181A]"
            >
              Tags
            </button>
          </div>

          {/* Links List */}
          <div>
            <AnimatePresence mode="popLayout">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
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
                  className="rounded-3xl bg-[#FBFAF8] py-16 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EEEA]">
                    {searchTerm ? (
                      <Search className="h-6 w-6 text-[#8C8981]" />
                    ) : (
                      <LinkIcon className="h-6 w-6 text-[#8C8981]" />
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
                      className="mx-auto flex items-center justify-center gap-2 rounded-full bg-[#FF5A14] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#E64D0C]"
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
