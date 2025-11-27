import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Link as LinkIcon, BarChart2, Settings } from 'lucide-react';

interface IconSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const IconSidebar: React.FC<IconSidebarProps> = ({ activeItem, onItemClick }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'links', icon: LinkIcon, label: 'Links' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-[#0a0a0f] border-r border-white/5 flex flex-col items-center py-6 z-20">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
          <LinkIcon className="w-5 h-5 text-cyan-400" />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                isActive
                  ? 'bg-white/10 text-cyan-400'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="iconSidebarActive"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              
              {/* Tooltip on hover */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
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
