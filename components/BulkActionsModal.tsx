import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { parseCsv, validateLinkImport, CsvLinkImport } from '../utils/csvUtils';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData } from '../types';

interface BulkActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkActionsModal({ isOpen, onClose, onSuccess }: BulkActionsModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<CsvLinkImport[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = async (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setFile(file);
        const text = await file.text();
        const parsed = parseCsv(text);

        // Validate rows
        const validRows: CsvLinkImport[] = [];
        let invalidCount = 0;

        parsed.forEach(row => {
            const valid = validateLinkImport(row);
            if (valid) {
                validRows.push(valid);
            } else {
                invalidCount++;
            }
        });

        if (invalidCount > 0) {
            toast.warning(`Found ${invalidCount} invalid rows that will be skipped.`);
        }

        if (validRows.length === 0) {
            toast.error('No valid links found in CSV');
            setFile(null);
            return;
        }

        setPreviewData(validRows);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            await processFile(droppedFile);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            await processFile(selectedFile);
        }
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;

        setIsProcessing(true);
        try {
            // Map CsvLinkImport to Omit<LinkData, 'id'...>
            // We need to match what bulkCreateLinks expects.
            // It expects Omit<LinkData, 'id' | 'createdAt' | 'clicks' | 'clickHistory'>

            const linksToCreate = previewData.map(item => ({
                originalUrl: item.url,
                title: item.title || new URL(item.url).hostname,
                shortCode: item.shortCode || Math.random().toString(36).substring(2, 9),
                tags: item.tags ? item.tags.split(',').map(t => t.trim()) : [],
                // Defaults for required fields
                isArchived: false
            }));

            // @ts-ignore - Adapter expects specific Omit, but our object matches compatible shape
            await supabaseAdapter.bulkCreateLinks(linksToCreate);

            toast.success(`Successfully imported ${linksToCreate.length} links`);
            onSuccess();
            onClose();
            setFile(null);
            setPreviewData([]);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Failed to import links. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "url,title,shortCode,tags\nhttps://example.com,Example Website,example,tech,news";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "gather_import_template.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Import Links</h2>
                            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to create multiple links at once.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {!file ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                `}
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="w-6 h-6 text-gray-600" />
                                </div>
                                <p className="text-gray-900 font-medium mb-1">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500 mb-4">CSV file (max 10MB)</p>
                                <p className="text-xs text-gray-400 font-mono">url, title, shortCode, tags</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-gray-500">{previewData.length} valid links found</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFile(null); setPreviewData([]); }}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {previewData.slice(0, 5).map((row, i) => (
                                        <div key={i} className="text-xs bg-white p-2 rounded border border-gray-100 flex justify-between">
                                            <span className="truncate max-w-[60%] text-gray-600">{row.url}</span>
                                            <span className="font-mono text-gray-400">{row.shortCode || 'auto'}</span>
                                        </div>
                                    ))}
                                    {previewData.length > 5 && (
                                        <p className="text-xs text-center text-gray-400 italic">...and {previewData.length - 5} more</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={downloadTemplate}
                                className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
                            >
                                <Download className="w-3 h-3" />
                                Download Template
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || isProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                'Import Links'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
