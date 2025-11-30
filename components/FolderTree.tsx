import React, { useState, useEffect } from 'react';
import { useDroppable, useDraggable, DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Folder } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, MoreVertical, Plus } from 'lucide-react';
import { FolderContextMenu } from './FolderContextMenu';
import { createPortal } from 'react-dom';

interface FolderTreeProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
    onRenameFolder: (id: string, name: string) => Promise<void>;
    onDeleteFolder: (id: string) => Promise<void>;
    onMoveFolder: (folderId: string, newParentId: string | null) => Promise<void>;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onMoveFolder
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId: string } | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [createParentId, setCreateParentId] = useState<string | null>(null);

    const handleCreateFolder = async (parentId: string | null) => {
        if (!newFolderName.trim()) return;

        try {
            await onCreateFolder(newFolderName.trim(), parentId);
            setNewFolderName('');
            setIsCreating(false);
            setCreateParentId(null);
            if (parentId) {
                setExpandedFolders(prev => new Set(prev).add(parentId));
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    };

    const handleRenameFolder = async () => {
        if (!editingFolderId || !editName.trim()) return;

        try {
            await onRenameFolder(editingFolderId, editName.trim());
            setEditingFolderId(null);
        } catch (error) {
            console.error('Failed to rename folder:', error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Are you sure you want to delete this folder? Subfolders and links will be moved to root.')) return;

        try {
            await onDeleteFolder(folderId);
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
            await onMoveFolder(folderId, newParentId);
        } catch (error) {
            console.error('Failed to move folder:', error);
        }
    };

    const toggleExpand = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, folderId });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const renderFolder = (folder: Folder, depth = 0) => {
        const children = folders.filter(f => f.parentId === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isEditing = editingFolderId === folder.id;

        return (
            <div key={folder.id} className="select-none">
                <FolderItem
                    folder={folder}
                    depth={depth}
                    isSelected={selectedFolderId === folder.id}
                    isExpanded={isExpanded}
                    hasChildren={children.length > 0}
                    onSelect={() => onSelectFolder(folder.id)}
                    onToggleExpand={() => toggleExpand(folder.id)}
                    onContextMenu={(e) => handleContextMenu(e, folder.id)}
                    isEditing={isEditing}
                    editName={editName}
                    setEditName={setEditName}
                    onSaveRename={handleRenameFolder}
                    onCancelRename={() => setEditingFolderId(null)}
                />

                {isExpanded && (
                    <div>
                        {children.map(child => renderFolder(child, depth + 1))}
                        {isCreating && createParentId === folder.id && (
                            <div style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }} className="pr-2 py-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateFolder(folder.id);
                                        if (e.key === 'Escape') { setIsCreating(false); setCreateParentId(null); }
                                    }}
                                    onBlur={() => { setIsCreating(false); setCreateParentId(null); }}
                                    placeholder="New folder..."
                                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const rootFolders = folders.filter(f => !f.parentId);

    return (
        <div className="w-full pb-20" onContextMenu={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Folders</h3>
                <button
                    onClick={() => { setIsCreating(true); setCreateParentId(null); }}
                    className="p-1 text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    title="New Root Folder"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-0.5">
                <RootDropZone
                    isSelected={selectedFolderId === null}
                    onSelect={() => onSelectFolder(null)}
                />

                {rootFolders.map(folder => renderFolder(folder))}

                {isCreating && createParentId === null && (
                    <div className="px-3 py-1">
                        <input
                            autoFocus
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder(null);
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            onBlur={() => setIsCreating(false)}
                            placeholder="New folder..."
                            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                )}
            </div>

            {contextMenu && (
                <FolderContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        setEditingFolderId(contextMenu.folderId);
                        setEditName(folders.find(f => f.id === contextMenu.folderId)?.name || '');
                    }}
                    onDelete={() => handleDeleteFolder(contextMenu.folderId)}
                    onAddSubfolder={() => {
                        setIsCreating(true);
                        setCreateParentId(contextMenu.folderId);
                        setExpandedFolders(prev => new Set(prev).add(contextMenu.folderId));
                    }}
                />
            )}
        </div>
    );
};

const RootDropZone = ({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'root',
        data: { type: 'FOLDER', id: 'root' } // Acts as a folder for dropping
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onSelect}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${isSelected
                ? 'bg-amber-50 text-amber-700 font-medium'
                : isOver
                    ? 'bg-amber-100 ring-2 ring-amber-300 ring-inset'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-slate-900'
                }`}
        >
            <FolderIcon className={`w-4 h-4 ${isSelected ? 'fill-amber-500/20 text-amber-500' : 'text-stone-400'}`} />
            All Links
        </button>
    );
};

interface FolderItemProps {
    folder: Folder;
    depth: number;
    isSelected: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    onSelect: () => void;
    onToggleExpand: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isEditing: boolean;
    editName: string;
    setEditName: (name: string) => void;
    onSaveRename: () => void;
    onCancelRename: () => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
    folder,
    depth,
    isSelected,
    isExpanded,
    hasChildren,
    onSelect,
    onToggleExpand,
    onContextMenu,
    isEditing,
    editName,
    setEditName,
    onSaveRename,
    onCancelRename
}) => {
    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: folder.id,
        data: { type: 'FOLDER', folder }
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: folder.id,
        data: { type: 'FOLDER', folder }
    });

    // Combine refs
    const setNodeRef = (node: HTMLElement | null) => {
        setDragRef(node);
        setDropRef(node);
    };

    if (isEditing) {
        return (
            <div
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                className="pr-2 py-1"
            >
                <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveRename();
                        if (e.key === 'Escape') onCancelRename();
                    }}
                    onBlur={onSaveRename}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onContextMenu={onContextMenu}
            onClick={(e) => {
                // Prevent selecting when clicking expand toggle
                if ((e.target as HTMLElement).closest('.expand-toggle')) return;
                onSelect();
            }}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            className={`
                group relative flex items-center gap-2 pr-3 py-2 rounded-lg text-sm cursor-pointer transition-all select-none
                ${isSelected ? 'bg-amber-50 text-amber-900 font-medium' : 'text-stone-600 hover:bg-stone-50 hover:text-slate-900'}
                ${isOver && !isDragging ? 'bg-amber-100 ring-2 ring-amber-300 ring-inset' : ''}
                ${isDragging ? 'opacity-50' : ''}
            `}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                }}
                className={`expand-toggle p-0.5 rounded hover:bg-black/5 ${!hasChildren ? 'opacity-0' : ''}`}
            >
                {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-stone-400" />
                )}
            </button>

            {isExpanded ? (
                <FolderOpen className={`w-4 h-4 ${isSelected ? 'fill-amber-500/20 text-amber-500' : 'text-stone-400 group-hover:text-amber-500'}`} />
            ) : (
                <FolderIcon className={`w-4 h-4 ${isSelected ? 'fill-amber-500/20 text-amber-500' : 'text-stone-400 group-hover:text-amber-500'}`} />
            )}

            <span className="truncate flex-1">{folder.name}</span>
        </div>
    );
};
