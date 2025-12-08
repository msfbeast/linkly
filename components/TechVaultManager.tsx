import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, GripVertical, Save, X, Package,
    Upload, Loader2, ExternalLink, Camera, Headphones, Laptop, Plug
} from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { TechVaultItem, TechVaultCategory } from '../types';
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

const categoryIcons: Record<TechVaultCategory, React.ElementType> = {
    camera: Camera,
    audio: Headphones,
    computer: Laptop,
    accessories: Plug,
    other: Package,
};

const categoryColors: Record<TechVaultCategory, string> = {
    camera: 'bg-purple-100 text-purple-600',
    audio: 'bg-orange-100 text-orange-600',
    computer: 'bg-blue-100 text-blue-600',
    accessories: 'bg-green-100 text-green-600',
    other: 'bg-stone-100 text-stone-600',
};

interface SortableItemProps {
    item: TechVaultItem;
    onDelete: (id: string) => void;
}

const SortableItem = ({ item, onDelete }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const Icon = categoryIcons[item.category || 'other'];
    const colorClass = categoryColors[item.category || 'other'];

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
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${colorClass}`}>
                        {item.category || 'other'}
                    </span>
                </div>
                <p className="text-sm text-stone-500 truncate">{item.brand}</p>
            </div>

            <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export const TechVaultManager: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<TechVaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState<Partial<TechVaultItem>>({
        category: 'other'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (user?.id) {
            fetchItems();
        }
    }, [user?.id]);

    const fetchItems = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await supabaseAdapter.getTechVaultItems(user.id);
            setItems(data);
        } catch (err) {
            console.error('Error fetching tech vault items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(currentItems, oldIndex, newIndex);

                // Save order to DB
                supabaseAdapter.updateTechVaultOrder(newItems).catch(console.error);

                return newItems;
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this item from your Tech Vault?')) return;
        try {
            await supabaseAdapter.deleteTechVaultItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !newItem.name) return;

        setSubmitting(true);
        try {
            let imageUrl = newItem.imageUrl;

            if (imageFile) {
                imageUrl = await supabaseAdapter.uploadTechVaultImage(imageFile, user.id);
            }

            const addedItem = await supabaseAdapter.addTechVaultItem(user.id, {
                name: newItem.name,
                brand: newItem.brand,
                category: newItem.category as TechVaultCategory,
                imageUrl,
                description: newItem.description,
                affiliateUrl: newItem.affiliateUrl,
            });

            setItems(prev => [...prev, addedItem]);
            setIsAdding(false);
            setNewItem({ category: 'other' });
            setImageFile(null);
        } catch (err) {
            console.error('Error adding item:', err);
            alert('Failed to add item. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Tech Vault</h3>
                    <p className="text-sm text-stone-500">Showcase your gear and equipment.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>

            {/* Add Item Form */}
            {isAdding && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-900">Add New Item</h4>
                        <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-4">
                            {/* Image Upload */}
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-bold text-stone-500 mb-1">Image</label>
                                <div className="w-20 h-20 bg-white border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors relative overflow-hidden group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setImageFile(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    {imageFile ? (
                                        <img
                                            src={URL.createObjectURL(imageFile)}
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
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newItem.name || ''}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="e.g. Sony A7IV"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Brand</label>
                                        <input
                                            type="text"
                                            value={newItem.brand || ''}
                                            onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="e.g. Sony"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 mb-1">Category</label>
                                        <select
                                            value={newItem.category || 'other'}
                                            onChange={e => setNewItem({ ...newItem, category: e.target.value as TechVaultCategory })}
                                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        >
                                            <option value="camera">📷 Camera</option>
                                            <option value="audio">🎧 Audio</option>
                                            <option value="computer">💻 Computer</option>
                                            <option value="accessories">🔌 Accessories</option>
                                            <option value="other">📦 Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-1">Description</label>
                            <textarea
                                value={newItem.description || ''}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none h-20 resize-none"
                                placeholder="Why I love this gear..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-1">Affiliate/Buy Link (optional)</label>
                            <div className="relative">
                                <ExternalLink className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                <input
                                    type="url"
                                    value={newItem.affiliateUrl || ''}
                                    onChange={e => setNewItem({ ...newItem, affiliateUrl: e.target.value })}
                                    className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                    placeholder="https://amazon.com/..."
                                />
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
                                Save Item
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Item List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                </div>
            ) : items.length === 0 && !isAdding ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-6 h-6 text-stone-400" />
                    </div>
                    <h4 className="text-stone-900 font-bold mb-1">No items added yet</h4>
                    <p className="text-stone-500 text-sm">Start building your gear showcase.</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {items.map((item) => (
                                <SortableItem key={item.id} item={item} onDelete={handleDelete} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
