
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { LinkData } from '../types';
import { BioWidget } from './BioWidget';

interface BioBlockProps {
    link: LinkData;
    onRemove: (id: string) => void;
    onResize?: (id: string, size: { w: number; h: number }) => void;
    readOnly?: boolean;
}

export const BioBlock: React.FC<BioBlockProps> = ({ link, onRemove, onResize, readOnly }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: link.id,
        data: { link } // Pass data for drag overlay if needed
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
        // Grid spanning
        gridColumn: `span ${link.layoutConfig?.w || 1}`,
        gridRow: `span ${link.layoutConfig?.h || 1}`,
    };

    const toggleSize = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onResize) return;

        const currentW = link.layoutConfig?.w || 1;
        // Toggle between 1x1 and 2x1 (Full Width)
        // If we want 2x2, we can add more logic
        const newSize = currentW === 1 ? { w: 2, h: 1 } : { w: 1, h: 1 };
        onResize(link.id, newSize);
    };

    // Render inner content based on Type
    const renderContent = () => {
        if (link.type === 'link') {
            return (
                <div className="flex items-center gap-3 p-3 h-full">
                    <div className="flex-1 overflow-hidden">
                        <p className="text-slate-900 text-sm font-bold truncate">{link.title}</p>
                        <p className="text-stone-500 text-xs truncate">{link.shortCode}</p>
                    </div>
                </div>
            );
        }
        return <BioWidget link={link} />;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden
                ${isDragging ? 'ring-2 ring-yellow-400 z-50' : 'hover:border-yellow-400/50'}
                ${link.type === 'link' ? 'min-h-[72px]' : 'min-h-[160px]'} 
            `}
        >
            {/* Drag Handle (Visible on Hover) */}
            {!readOnly && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            {/* Controls (Visible on Hover) */}
            {!readOnly && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    {/* Resize Button (Only for widgets, standard links usually stick to 1x1 or 2x1 list style, but let's allow all) */}
                    <button
                        onClick={toggleSize}
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-stone-400 hover:text-slate-900 transition-colors"
                        title={link.layoutConfig?.w === 2 ? "Shrink" : "Expand"}
                    >
                        {link.layoutConfig?.w === 2 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(link.id)}
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="h-full w-full">
                {renderContent()}
            </div>
        </div>
    );
};
