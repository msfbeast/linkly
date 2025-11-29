import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { LinkData } from '../types';

interface SortableBioLinkItemProps {
    link: LinkData;
    onRemove: (id: string) => void;
}

export const SortableBioLinkItem: React.FC<SortableBioLinkItemProps> = ({ link, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white shadow-sm group ${isDragging ? 'ring-2 ring-yellow-400' : 'hover:border-yellow-400/50'}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 p-1 -ml-1"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 overflow-hidden">
                <p className="text-slate-900 text-sm font-medium truncate">{link.title}</p>
                <p className="text-stone-500 text-xs truncate">{link.shortCode}</p>
            </div>

            <button
                onClick={() => onRemove(link.id)}
                className="text-stone-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                title="Remove from Bio"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
