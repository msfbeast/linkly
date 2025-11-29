import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Folder } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

interface FolderTreeProps {
    userId: string;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ userId, selectedFolderId, onSelectFolder }) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadFolders();
    }, [userId]);

    const loadFolders = async () => {
        try {
            const loadedFolders = await supabaseAdapter.getFolders(userId);
            setFolders(loadedFolders);
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const newFolder = await supabaseAdapter.createFolder({
                userId,
                name: newFolderName.trim(),
                parentId: null, // Root level for now
            });
            setFolders([...folders, newFolder]);
            setNewFolderName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    };

    const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this folder? Links inside will be moved to root.')) return;

        try {
            await supabaseAdapter.deleteFolder(folderId);
            setFolders(folders.filter(f => f.id !== folderId));
            if (selectedFolderId === folderId) {
                onSelectFolder(null);
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
        }
    };

    const toggleExpand = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    // Build tree structure (currently flat list for simplicity, but prepared for nesting)
    const rootFolders = folders.filter(f => !f.parentId);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Folders</h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="text-gray-400 hover:text-blue-500"
                >
                    +
                </button>
            </div>

            <div className="space-y-1">
                <button
                    onClick={() => onSelectFolder(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${selectedFolderId === null ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    <span className="text-lg">📁</span>
                    All Links
                </button>

                {rootFolders.map(folder => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={onSelectFolder}
                        onDeleteFolder={handleDeleteFolder}
                    />
                ))}

                {isCreating && (
                    <div className="px-3 py-2">
                        <input
                            autoFocus
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            onBlur={() => setIsCreating(false)}
                            placeholder="Folder name..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface FolderItemProps {
    folder: Folder;
    selectedFolderId: string | null;
    onSelectFolder: (id: string) => void;
    onDeleteFolder: (id: string, e: React.MouseEvent) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, selectedFolderId, onSelectFolder, onDeleteFolder }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: folder.id,
        data: { folder },
    });

    return (
        <div ref={setNodeRef}>
            <button
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors ${selectedFolderId === folder.id ? 'bg-blue-50 text-blue-600' :
                        isOver ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : 'text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">📂</span>
                    {folder.name}
                </div>
                <button
                    onClick={(e) => onDeleteFolder(folder.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                    ×
                </button>
            </button>
        </div>
    );
};
