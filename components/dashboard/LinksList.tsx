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
    onRestore?: (id: string) => void;
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
    onRestore,
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
                <div className="h-12 animate-pulse rounded-2xl bg-[#F0EEEA]" />

                {/* List Skeletons */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex h-24 animate-pulse items-center gap-4 rounded-3xl bg-white p-4">
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
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F0EEEA] p-1.5">
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
                    <div>
                        <AnimatePresence mode='popLayout'>
                            {filteredLinks.length > 0 ? (
                                filteredLinks.map((link) => (
                                    <LinkCard
                                        key={link.id}
                                        link={link}
                                        onEdit={() => onEdit(link)}
                                        onDelete={() => onDelete(link.id)}
                                        onArchive={onArchive ? () => onArchive(link.id) : undefined}
                                        onRestore={onRestore ? () => onRestore(link.id) : undefined}
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
                                    className="rounded-3xl border border-dashed border-[#D9D6D0] py-12 text-center"
                                >
                                    <LinkIcon className="mx-auto mb-3 h-6 w-6 text-[#A19E97]" />
                                    <h3 className="text-[15px] font-medium text-[#18181A]">{searchTerm ? 'No links match' : 'No links yet'}</h3>
                                    <p className="mt-1 text-[13px] text-[#8C8981]">
                                        {searchTerm ? 'Try a different search.' : 'Paste a link in the box above, or set one up with more options.'}
                                    </p>
                                    {!searchTerm && (
                                        <button
                                            onClick={onCreateFirstLink}
                                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F0EEEA] px-5 py-2.5 text-[13px] font-medium text-[#18181A] transition-colors hover:bg-[#E6E3DD]"
                                        >
                                            More options <ArrowUpRight className="h-4 w-4" />
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

