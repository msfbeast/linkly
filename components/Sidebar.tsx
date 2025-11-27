import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings, Link as LinkIcon, Code2, Layers, UserCircle2, Zap, ShoppingBag } from 'lucide-react';
import { ViewState } from '../types';

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
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-sparks-bg border-r border-slate-200 dark:border-white/5 p-6 flex flex-col z-20 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 px-2 mt-2">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-white/10">
            <LinkIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-white to-slate-500 dark:to-slate-400 tracking-tight">
          Linkly AI
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-slate-100 dark:bg-white/5 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
              <span className="font-medium text-sm tracking-wide relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="bg-gradient-to-br from-slate-100 dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-emerald-400/20" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider uppercase">AI Model</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Gemini 2.5 Flash is active and analyzing your links.</p>
          <div className="w-full bg-slate-300 dark:bg-slate-700/50 h-1 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] rounded-full"
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