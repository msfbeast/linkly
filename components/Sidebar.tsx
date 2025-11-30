import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings, Link as LinkIcon, Code2, Layers, UserCircle2, Zap, ShoppingBag } from 'lucide-react';
import { ViewState } from '../types';
import TeamSwitcher from './TeamSwitcher';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewState.PRODUCTS, icon: ShoppingBag, label: 'Products' },
    { id: ViewState.BIO_PAGES, icon: UserCircle2, label: 'Link-in-Bio' },
    { id: ViewState.ANALYTICS, icon: BarChart2, label: 'Analytics' },
    { id: ViewState.API, icon: Code2, label: 'Developer API' },
    { id: ViewState.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-4 top-4 bottom-4 w-64 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col p-6 z-50 transition-all duration-300">
      {/* Team Switcher */}
      <div className="mb-8 px-2">
        <TeamSwitcher />
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              data-tour={item.id === ViewState.BIO_PAGES ? 'bio-nav' : undefined}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                ? 'text-white shadow-lg shadow-slate-900/20'
                : 'text-stone-500 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-slate-900 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'}`} />
              <span className={`font-bold text-sm tracking-wide relative z-10 ${isActive ? 'text-white' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        {/* AI Model card removed */}
      </div>
    </div>
  );
};

export default Sidebar;