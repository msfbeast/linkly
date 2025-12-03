import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Camera, Aperture, Maximize2, Download } from 'lucide-react';
import { GalleryItem } from '../../types';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';

interface GalleryBlockProps {
    items?: GalleryItem[];
    userId?: string;
}

export const GalleryBlock: React.FC<GalleryBlockProps> = ({ items: propItems, userId }) => {
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [fetchedItems, setFetchedItems] = useState<GalleryItem[]>([]);

    useEffect(() => {
        if (!propItems && userId) {
            const fetchItems = async () => {
                try {
                    const data = await supabaseAdapter.getGalleryItems(userId);
                    setFetchedItems(data);
                } catch (error) {
                    console.error('Error fetching gallery items:', error);
                }
            };
            fetchItems();
        }
    }, [userId, propItems]);

    const items = propItems || fetchedItems;

    if (!items || items.length === 0) return null;

    return (
        <div className="w-full">
            {/* Masonry Grid */}
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        layoutId={`gallery-item-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="break-inside-avoid relative group cursor-zoom-in rounded-2xl overflow-hidden bg-stone-100 mb-4"
                        whileHover={{ y: -4 }}
                    >
                        <img
                            src={item.url}
                            alt={item.caption || 'Gallery Image'}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="text-white text-xs font-medium">
                                {item.exifData?.model ? (
                                    <div className="flex items-center gap-1">
                                        <Camera className="w-3 h-3" />
                                        {item.exifData.model}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Maximize2 className="w-3 h-3" />
                                        View
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setSelectedItem(null)}
                    >
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <div
                            className="flex flex-col md:flex-row max-w-6xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Image Area */}
                            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                                <motion.img
                                    layoutId={`gallery-item-${selectedItem.id}`}
                                    src={selectedItem.url}
                                    alt={selectedItem.caption}
                                    className="max-w-full max-h-[80vh] md:max-h-full object-contain"
                                />
                            </div>

                            {/* Sidebar / Info Area */}
                            <div className="w-full md:w-80 bg-stone-900 border-l border-white/10 p-6 flex flex-col">
                                <h3 className="text-white font-bold text-lg mb-1">
                                    {selectedItem.caption || 'Untitled Shot'}
                                </h3>
                                <p className="text-stone-400 text-xs mb-6">
                                    Uploaded {new Date(selectedItem.createdAt).toLocaleDateString()}
                                </p>

                                {selectedItem.exifData ? (
                                    <div className="space-y-4">
                                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                            <h4 className="text-stone-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Camera className="w-3 h-3" /> Camera
                                            </h4>
                                            <div>
                                                <p className="text-white font-medium">{selectedItem.exifData.model || 'Unknown'}</p>
                                                <p className="text-stone-500 text-xs">{selectedItem.exifData.make}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                            <h4 className="text-stone-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                <Aperture className="w-3 h-3" /> Settings
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-stone-500 text-xs">ISO</p>
                                                    <p className="text-white font-mono">{selectedItem.exifData.iso || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-500 text-xs">Aperture</p>
                                                    <p className="text-white font-mono">f/{selectedItem.exifData.fNumber || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-500 text-xs">Shutter</p>
                                                    <p className="text-white font-mono">
                                                        {selectedItem.exifData.exposureTime
                                                            ? (selectedItem.exifData.exposureTime < 1
                                                                ? `1/${Math.round(1 / selectedItem.exifData.exposureTime)}`
                                                                : selectedItem.exifData.exposureTime)
                                                            : '-'}s
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-stone-500 text-xs">Focal Len</p>
                                                    <p className="text-white font-mono">{selectedItem.exifData.focalLength ? `${selectedItem.exifData.focalLength}mm` : '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <Info className="w-6 h-6 text-stone-500 mx-auto mb-2" />
                                        <p className="text-stone-400 text-sm">No EXIF data available</p>
                                    </div>
                                )}

                                <div className="mt-auto pt-6">
                                    <a
                                        href={selectedItem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-stone-200 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Original
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
