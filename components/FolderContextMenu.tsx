import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, FolderPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onAddSubfolder: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
    x,
    y,
    onClose,
    onRename,
    onDelete,
    onAddSubfolder,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position to keep menu within viewport
    const adjustedX = Math.min(x, window.innerWidth - 200);
    const adjustedY = Math.min(y, window.innerHeight - 150);

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: adjustedY, left: adjustedX }}
                className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 w-48 overflow-hidden py-1"
            >
                <button
                    onClick={() => { onRename(); onClose(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                    <Edit2 className="w-4 h-4 text-stone-400" />
                    Rename
                </button>
                <button
                    onClick={() => { onAddSubfolder(); onClose(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                    <FolderPlus className="w-4 h-4 text-stone-400" />
                    Add Subfolder
                </button>
                <div className="h-px bg-stone-100 my-1" />
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
