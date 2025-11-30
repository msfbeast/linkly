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
    <div className="fixed left-0 top-0 h-full w-64 bg-[#FDFBF7] border-r border-stone-200 p-6 flex flex-col z-20 transition-colors duration-200">
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
                ? 'text-slate-900'
                : 'text-stone-500 hover:text-slate-900 hover:bg-stone-100'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-yellow-100/50 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-r-full shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-yellow-600' : 'text-stone-400 group-hover:text-stone-600'}`} />
              <span className="font-medium text-sm tracking-wide relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-200" />
            <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">AI Model</span>
          </div>
          <p className="text-xs text-stone-500 mb-2">Gemini 2.5 Flash is active and analyzing your links.</p>
          <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-yellow-400 rounded-full"
              animate={{
                width: ["60%", "75%", "60%"],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;