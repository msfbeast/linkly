import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface CollapsibleWidgetProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    id?: string;
}

export const CollapsibleWidget: React.FC<CollapsibleWidgetProps> = ({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    className = "",
    id
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div id={id} className={`bg-white border border-stone-200 rounded-2xl shadow-sm transition-all duration-200 ${className} ${isOpen ? 'ring-1 ring-black/5' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-white to-stone-50/50 hover:to-indigo-50/30 transition-all border-b border-transparent hover:border-indigo-100 rounded-t-2xl group"
            >
                <div className="flex items-center gap-4">
                    <div className={`
                        p-2.5 rounded-xl transition-all duration-300 ring-1 ring-inset
                        ${isOpen
                            ? 'bg-indigo-50 text-indigo-600 ring-indigo-100 shadow-sm'
                            : 'bg-white text-stone-400 ring-stone-200 group-hover:text-indigo-500 group-hover:ring-indigo-100'
                        }
                    `}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`font-space font-bold text-lg tracking-tight transition-colors ${isOpen ? 'text-slate-900' : 'text-stone-600 group-hover:text-slate-800'}`}>
                        {title}
                    </h3>
                </div>
                <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300
                    ${isOpen
                        ? 'bg-stone-100 text-slate-900 rotate-180'
                        : 'text-stone-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm'
                    }
                `}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>

            {isOpen && (
                <div className="p-6 pt-0 animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};
