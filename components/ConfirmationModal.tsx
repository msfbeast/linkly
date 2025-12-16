import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Archive, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void; // Primary action (usually Archive)
    onSecondary?: () => void; // Secondary action (Delete)
    title?: string;
    description?: string;
    confirmLabel?: string;
    secondaryLabel?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onSecondary,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    secondaryLabel,
    type = 'warning'
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-stone-500 text-sm leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-stone-400 hover:text-stone-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={onConfirm}
                                        className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Archive className="w-4 h-4" />
                                        {confirmLabel}
                                    </button>

                                    {onSecondary && (
                                        <button
                                            onClick={onSecondary}
                                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {secondaryLabel || 'Delete'}
                                        </button>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="sm:hidden px-4 py-2.5 text-stone-500 font-semibold hover:bg-stone-50 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmationModal;
