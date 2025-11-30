import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Link as LinkIcon, BarChart2, Settings, ShoppingBag } from 'lucide-react';

interface IconSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ activeItem, onItemClick }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: ShoppingBag, label: 'Products' },
    { id: 'links', icon: LinkIcon, label: 'Links' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-4 top-4 bottom-4 w-20 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col items-center py-8 z-20">
      {/* Logo */}
      <div className="mb-10">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3 hover:rotate-0 transition-all duration-300">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-4 w-full px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group ${isActive
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                : 'text-stone-400 hover:text-slate-900 hover:bg-white/50'
                }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />

              {/* Tooltip on hover */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default IconSidebar;
