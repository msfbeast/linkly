import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, Trash2, Info, GripVertical } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { GalleryItem } from '../types';
import exifr from 'exifr';

interface GalleryManagerProps {
    onUpdate?: () => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ onUpdate }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.id) {
            fetchItems();
        }
    }, [user?.id]);

    const fetchItems = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await supabaseAdapter.getGalleryItems(user.id);
            setItems(data);
        } catch (err) {
            console.error('Error fetching gallery items:', err);
            setError('Failed to load gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !user?.id) return;

        const file = e.target.files[0];
        setUploading(true);
        setError(null);

        try {
            // 1. Extract EXIF Data
            let exifData = null;
            try {
                // Parse EXIF, specifically looking for camera details
                const output = await exifr.parse(file, {
                    tiff: true,
                    exif: true,
                    gps: false, // Don't need location for now (privacy)
                });

                if (output) {
                    exifData = {
                        make: output.Make,
                        model: output.Model,
                        iso: output.ISO,
                        fNumber: output.FNumber,
                        exposureTime: output.ExposureTime,
                        focalLength: output.FocalLength,
                        lensModel: output.LensModel,
                        createDate: output.CreateDate,
                    };
                }
            } catch (exifErr) {
                console.warn('Failed to parse EXIF:', exifErr);
                // Continue upload even if EXIF fails
            }

            // 2. Get Image Dimensions
            const dimensions = await new Promise<{ width: number, height: number }>((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.src = URL.createObjectURL(file);
            });

            // 3. Upload File
            const publicUrl = await supabaseAdapter.uploadGalleryImage(file, user.id);

            // 4. Add to Database
            await supabaseAdapter.addGalleryItem(
                user.id,
                publicUrl,
                file.name.split('.')[0], // Default caption is filename
                exifData,
                dimensions.width,
                dimensions.height
            );

            // 5. Refresh
            await fetchItems();
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            await supabaseAdapter.deleteGalleryItem(id);
            setItems(prev => prev.filter(item => item.id !== id));
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete image');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Tech Vault (Gallery)</h3>
                    <p className="text-sm text-stone-500">Showcase your camera samples with EXIF data.</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Photo
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                />
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-6 h-6 text-stone-400" />
                    </div>
                    <h4 className="text-stone-900 font-bold mb-1">No images yet</h4>
                    <p className="text-stone-500 text-sm mb-4">Upload your first camera sample to start your gallery.</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-indigo-600 font-bold text-sm hover:underline"
                    >
                        Upload a photo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative aspect-square bg-stone-100 rounded-xl overflow-hidden border border-stone-200"
                            >
                                <img
                                    src={item.url}
                                    alt={item.caption || 'Gallery image'}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-white text-xs">
                                        {item.exifData?.model && (
                                            <p className="font-bold truncate">{item.exifData.model}</p>
                                        )}
                                        {item.exifData?.iso && (
                                            <p className="opacity-80">ISO {item.exifData.iso} • f/{item.exifData.fNumber}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
