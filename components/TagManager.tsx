import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag as TagIcon, Trash2, Edit2, Check, Plus, Palette } from 'lucide-react';
import { Tag } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

interface TagManagerProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onTagsUpdate: () => void;
}

const COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#f59e0b', // amber-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
    '#0ea5e9', // sky-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#64748b', // slate-500
];

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, userId, onTagsUpdate }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);

    useEffect(() => {
        if (isOpen) {
            loadTags();
        }
    }, [isOpen, userId]);

    const loadTags = async () => {
        try {
            const loadedTags = await supabaseAdapter.getTags(userId);
            setTags(loadedTags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        try {
            await supabaseAdapter.createTag({
                userId,
                name: newTagName.trim(),
                color: newTagColor,
            });
            setNewTagName('');
            setNewTagColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
            await loadTags();
            onTagsUpdate();
        } catch (error) {
            console.error('Failed to create tag:', error);
        }
    };

    const handleDeleteTag = async (tagId: string) => {
        if (!confirm('Are you sure you want to delete this tag? It will be removed from all links.')) return;

        try {
            await supabaseAdapter.deleteTag(tagId);
            await loadTags();
            onTagsUpdate();
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    };

    const startEditing = (tag: Tag) => {
        setEditingTagId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color);
    };

    const saveEditing = async () => {
        if (!editingTagId || !editName.trim()) return;

        try {
            // We need to implement updateTag in supabaseAdapter first, but for now we can delete and recreate or just update locally if we had an update method
            // Since we don't have updateTag yet, we will implement it in the next step.
            // For now, let's assume we have it or add it.
            await supabaseAdapter.updateTag(editingTagId, {
                name: editName.trim(),
                color: editColor
            });

            setEditingTagId(null);
            await loadTags();
            onTagsUpdate();
        } catch (error) {
            console.error('Failed to update tag:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-amber-500" />
                        Manage Tags
                    </h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-slate-900 p-2 hover:bg-stone-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Create New Tag */}
                    <div className="mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">Create New Tag</label>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="color"
                                    value={newTagColor}
                                    onChange={(e) => setNewTagColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                />
                                <div className="absolute inset-0 pointer-events-none border border-stone-200 rounded-lg" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tag name..."
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                            />
                            <button
                                onClick={handleCreateTag}
                                disabled={!newTagName.trim()}
                                className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 p-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tag List */}
                    <div className="space-y-2">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex items-center gap-3 p-3 bg-white border border-stone-100 rounded-xl hover:border-stone-200 transition-colors group">
                                {editingTagId === tag.id ? (
                                    <>
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={editColor}
                                                onChange={(e) => setEditColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                                            />
                                            <div className="absolute inset-0 pointer-events-none border border-stone-200 rounded-lg" />
                                        </div>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-2 py-1 rounded border border-stone-200 text-sm"
                                            autoFocus
                                        />
                                        <button onClick={saveEditing} className="text-green-500 hover:bg-green-50 p-1.5 rounded-lg">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditingTagId(null)} className="text-stone-400 hover:bg-stone-100 p-1.5 rounded-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                        <span className="flex-1 font-medium text-slate-700">{tag.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditing(tag)} className="text-stone-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteTag(tag.id)} className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {tags.length === 0 && (
                            <p className="text-center text-stone-400 text-sm py-4">No tags created yet.</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
