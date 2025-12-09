import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings, Link as LinkIcon, Code2, Layers, UserCircle2, Zap, ShoppingBag, Sun, Moon, Monitor } from 'lucide-react';
import { ViewState } from '../types';
import TeamSwitcher from './TeamSwitcher';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const menuItems = [
    { id: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    { id: ViewState.PRODUCTS, icon: ShoppingBag, label: 'Products' },
    { id: ViewState.BIO_PAGES, icon: UserCircle2, label: 'Link-in-Bio' },
    { id: ViewState.ANALYTICS, icon: BarChart2, label: 'Analytics' },
    { id: ViewState.API, icon: Code2, label: 'Developer API' },
    { id: ViewState.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  const themeOptions: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'Auto' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`fixed left-4 top-4 bottom-4 w-64 bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col p-6 z-50 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}>
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
                onClick={() => {
                  onChangeView(item.id);
                  if (window.innerWidth < 768) onClose();
                }}
                data-tour={item.id === ViewState.BIO_PAGES ? 'bio-nav' : undefined}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                  ? 'text-white shadow-lg shadow-slate-900/20'
                  : 'text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-white dark:text-slate-900' : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} />
                <span className={`font-bold text-sm tracking-wide relative z-10 ${isActive ? 'text-white dark:text-slate-900' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="mt-auto pt-4 border-t border-stone-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-1 p-1 bg-stone-100 dark:bg-white/10 rounded-xl">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;