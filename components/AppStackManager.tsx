import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, GripVertical, Save, X, Smartphone,
    Upload, Loader2, ExternalLink, DollarSign, Wand2, Search
} from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { AppRecommendation } from '../types';
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
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableAppItemProps {
    app: AppRecommendation;
    onDelete: (id: string) => void;
}

const SortableAppItem = ({ app, onDelete }: SortableAppItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: app.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4 group hover:shadow-md transition-all"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-stone-400 hover:text-stone-600">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                {app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Smartphone className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 truncate">{app.name}</h4>
                    {app.isPaid && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                            Paid
                        </span>
                    )}
                </div>
                <p className="text-sm text-stone-500 truncate">{app.category} • {app.developer}</p>
            </div>

            <button
                onClick={() => onDelete(app.id)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export const AppStackManager: React.FC = () => {
    const { user } = useAuth();
    const [apps, setApps] = useState<AppRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newApp, setNewApp] = useState<Partial<AppRecommendation>>({
        isPaid: false
    });
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [lookupUrl, setLookupUrl] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (user?.id) {
            fetchApps();
        }
    }, [user?.id]);

    const fetchApps = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await supabaseAdapter.getApps(user.id);
            setApps(data);
        } catch (err) {
            console.error('Error fetching apps:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setApps((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save order to DB
                supabaseAdapter.updateAppOrder(newItems).catch(console.error);

                return newItems;
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this app from your stack?')) return;
        try {
            await supabaseAdapter.deleteApp(id);
            setApps(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            console.error('Error deleting app:', err);
        }
    };

    // URL Auto-Lookup
    const handleLookupUrl = async () => {
        if (!lookupUrl.trim()) return;

        setIsLookingUp(true);
        try {
            const response = await fetch('/api/apps/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: lookupUrl })
            });

            if (!response.ok) throw new Error('Lookup failed');

            const data = await response.json();

            // Auto-fill form with fetched data
            setNewApp(prev => ({
                ...prev,
                name: data.name || prev.name,
                developer: data.developer || prev.developer,
                category: data.category || prev.category,
                description: data.description || prev.description,
                iconUrl: data.iconUrl || prev.iconUrl,
                linkUrl: data.linkUrl || lookupUrl,
                isPaid: data.isPaid ?? prev.isPaid
            }));

            setLookupUrl('');
        } catch (err) {
            console.error('URL lookup failed:', err);
            alert('Could not fetch app info. Please fill in manually.');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !newApp.name) return;

        setSubmitting(true);
        try {
            let iconUrl = newApp.iconUrl;

            if (iconFile) {
                iconUrl = await supabaseAdapter.uploadAppIcon(iconFile, user.id);
            }

            const addedApp = await supabaseAdapter.addApp(user.id, {
                name: newApp.name,
                iconUrl,
                developer: newApp.developer,
                category: newApp.category,
                description: newApp.description,
                linkUrl: newApp.linkUrl,
                isPaid: newApp.isPaid || false
            });

            setApps(prev => [...prev, addedApp]);
            setIsAdding(false);
            setNewApp({ isPaid: false });
            setIconFile(null);
        } catch (err) {
            console.error('Error adding app:', err);
            alert('Failed to add app. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">App Stack</h3>
                    <p className="text-sm text-stone-500">Share your favorite apps ("What's on my phone").</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add App
                </button>
            </div>

            {/* Add App Form */}
            {isAdding && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-900">Add New App</h4>
                        <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* URL Lookup */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <label className="block text-xs font-bold text-indigo-600 mb-2">✨ Auto-fill from App Store URL</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-indigo-400" />
                                    <input
                                        type="url"
                                        value={lookupUrl}
                                        onChange={e => setLookupUrl(e.target.value)}
                                        className="w-full bg-white border border-indigo-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="https://apps.apple.com/... or play.google.com/..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLookupUrl}
                                    disabled={isLookingUp || !lookupUrl.trim()}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    Lookup
                                </button>
                            </div>
                            <p className="text-[10px] text-indigo-500 mt-2">Paste an App Store or Play Store URL to auto-fill app details</p>
                        </div>

                        <div className="flex gap-4">
                            {/* Icon Upload */}
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-bold text-stone-500 mb-1">App Icon</label>
                                <div className="w-20 h-20 bg-white border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors relative overflow-hidden group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setIconFile(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    {iconFile ? (
                                        <img
                                            src={URL.createObjectURL(iconFile)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-stone-400 mb-1" />
                                            <span className="text-[10px] text-stone-400">Upload</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">App Name</label>
                                    <input
                                        type="text"
                                        value={newApp.name || ''}
                                        onChange={e => setNewApp({ ...newApp, name: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="e.g. Notion"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={newApp.category || ''}
                                            onChange={e => setNewApp({ ...newApp, category: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="e.g. Productivity"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Developer</label>
                                        <input
                                            type="text"
                                            value={newApp.developer || ''}
                                            onChange={e => setNewApp({ ...newApp, developer: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="e.g. Notion Labs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-1">Description (Why I use it)</label>
                            <textarea
                                value={newApp.description || ''}
                                onChange={e => setNewApp({ ...newApp, description: e.target.value })}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none h-20 resize-none"
                                placeholder="The best all-in-one workspace..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-stone-500 mb-1">Link URL</label>
                                <div className="relative">
                                    <ExternalLink className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                    <input
                                        type="url"
                                        value={newApp.linkUrl || ''}
                                        onChange={e => setNewApp({ ...newApp, linkUrl: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="https://apps.apple.com/..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newApp.isPaid || false}
                                        onChange={e => setNewApp({ ...newApp, isPaid: e.target.checked })}
                                        className="rounded border-stone-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <span className="text-sm font-medium text-slate-900">Paid App?</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save App
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* App List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                </div>
            ) : apps.length === 0 && !isAdding ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-6 h-6 text-stone-400" />
                    </div>
                    <h4 className="text-stone-900 font-bold mb-1">No apps added yet</h4>
                    <p className="text-stone-500 text-sm">Start building your "What's on my phone" stack.</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={apps.map(app => app.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {apps.map((app) => (
                                <SortableAppItem key={app.id} app={app} onDelete={handleDelete} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
