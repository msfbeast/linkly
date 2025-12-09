import React, { useState } from 'react';
import { LinkData } from '../types';
import { Copy, QrCode, ExternalLink, BarChart3, Calendar, ArrowRight, Check, MoreVertical, Edit2, Trash2, Link as LinkIcon, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartLinkCardProps {
    link: LinkData;
    onCopy?: (text: string) => void;
    onEdit?: (link: LinkData) => void;
    onDelete?: (id: string) => void;
}

const SmartLinkCard: React.FC<SmartLinkCardProps> = ({ link, onCopy, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/${link.shortCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        onCopy?.(url);
        setTimeout(() => setCopied(false), 2000);
    };

    const fullUrl = `${window.location.origin}/${link.shortCode}`;
    const date = new Date(link.createdAt).toLocaleDateString();

    return (
        <div className="w-full max-w-sm mx-auto bg-[#fefefe] rounded-[2rem] p-2 text-[#141417] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300">
            {/* Hero Section */}
            <div className="bg-[#fef4e2] rounded-[1.5rem] border border-[#f0e5d4] p-6 flex flex-col justify-between h-[200px] relative group">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-white w-10 h-10 flex justify-center items-center rounded-full shadow-sm flex-shrink-0 overflow-hidden">
                            <img
                                src={(() => {
                                    try {
                                        const u = new URL(link.originalUrl);
                                        if (!['http:', 'https:'].includes(u.protocol)) return undefined;
                                        return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
                                    } catch { return undefined; }
                                })()}
                                alt="Logo"
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <LinkIcon className="w-5 h-5 text-[#141417] hidden" />
                        </div>
                        <span className="font-bold text-sm text-[#141417] opacity-60">
                            /{link.shortCode}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <div className="mt-auto mb-2">
                    <h3 className="text-2xl font-extrabold leading-tight text-[#141417] line-clamp-2" title={link.title}>
                        {link.title}
                    </h3>
                    <p className="text-xs text-[#141417] opacity-50 truncate mt-1">{link.originalUrl}</p>
                </div>

                {/* Hover Actions (Absolute) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(link); }}
                        className="p-2 bg-white rounded-full hover:bg-stone-100 text-[#141417] shadow-sm"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(link.id); }}
                        className="p-2 bg-white rounded-full hover:bg-red-50 text-red-500 shadow-sm"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Footer Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 mt-1 relative z-10">
                {/* Stats */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-[#141417]">
                        <Eye className="w-4 h-4" />
                        <span>{link.clicks.toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-medium text-[#141417] opacity-40">
                        {date}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#141417] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="Visit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                        onClick={handleCopy}
                        className="flex-1 sm:flex-none py-1.5 px-5 bg-[#141417] text-white rounded-lg font-medium text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        {copied ? <Check className="w-4 h-4" /> : null}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartLinkCard;
