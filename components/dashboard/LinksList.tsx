import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link as LinkIcon, ArrowUpRight, Trash2, CheckSquare, Square, X } from 'lucide-react';
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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LinkCard from '../LinkCard';
import { LinkData } from '../../types';

interface LinksListProps {
    links: LinkData[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onDragEnd: (event: DragEndEvent) => void;
    onEdit: (link: LinkData) => void;
    onDelete: (id: string) => void;
    onArchive?: (id: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    onDuplicate?: (link: LinkData) => void;
    onCreateFirstLink: () => void;
    isLoading?: boolean;
}

const LinksList: React.FC<LinksListProps> = ({
    links,
    searchTerm,
    setSearchTerm,
    onDragEnd,
    onEdit,
    onDelete,
    onArchive,
    onBulkDelete,
    onDuplicate,
    onCreateFirstLink,
    isLoading = false
}) => {
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const filteredLinks = links.filter(link =>
        (link.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.originalUrl || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(id);
            } else {
                newSet.delete(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredLinks.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLinks.map(l => l.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        const message = `Are you sure you want to delete ${selectedIds.size} link${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`;
        if (confirm(message)) {
            if (onBulkDelete) {
                onBulkDelete(Array.from(selectedIds));
            } else {
                // Fallback: delete one by one
                selectedIds.forEach(id => onDelete(id));
            }
            setSelectedIds(new Set());
            setIsSelectMode(false);
        }
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Search Skeleton */}
                <div className="h-12 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl animate-pulse" />

                {/* List Skeletons */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-white rounded-2xl border border-stone-100 shadow-sm animate-pulse flex items-center p-4 gap-4">
                            <div className="w-12 h-12 bg-stone-100 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-stone-100 rounded-full" />
                                <div className="h-3 w-1/2 bg-stone-50 rounded-full" />
                            </div>
                            <div className="w-20 h-8 bg-stone-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex items-center justify-between gap-4 bg-white/60 backdrop-blur-xl border border-white/40 p-2 rounded-2xl shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search your links..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 placeholder:text-stone-400"
                    />
                </div>

                {/* Bulk Actions */}
                {isSelectMode ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            {selectedIds.size === filteredLinks.length ? (
                                <><CheckSquare className="w-4 h-4" /> Deselect All</>
                            ) : (
                                <><Square className="w-4 h-4" /> Select All</>
                            )}
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedIds.size === 0}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedIds.size > 0
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                        </button>
                        <button
                            onClick={exitSelectMode}
                            className="p-1.5 text-stone-400 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSelectMode(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                        >
                            <CheckSquare className="w-4 h-4" /> Select
                        </button>
                        <div className="px-4 py-1 text-xs font-bold text-stone-400 uppercase tracking-wider border-l border-stone-200">
                            {filteredLinks.length} Links
                        </div>
                    </div>
                )}
            </div>

            {/* Links List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                <SortableContext
                    items={filteredLinks.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {filteredLinks.length > 0 ? (
                                filteredLinks.map((link) => (
                                    <LinkCard
                                        key={link.id}
                                        link={link}
                                        onEdit={() => onEdit(link)}
                                        onDelete={() => onDelete(link.id)}
                                        onArchive={onArchive ? () => onArchive(link.id) : undefined}
                                        onDuplicate={onDuplicate}
                                        selectable={isSelectMode}
                                        selected={selectedIds.has(link.id)}
                                        onSelect={handleToggleSelect}
                                    />
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white/40 border-dashed"
                                >
                                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <LinkIcon className="w-8 h-8 text-stone-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No links found</h3>
                                    <p className="text-stone-500 mb-6">
                                        {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first link"}
                                    </p>
                                    {!searchTerm && (
                                        <button
                                            onClick={onCreateFirstLink}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                                        >
                                            Create Link <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default LinksList;

