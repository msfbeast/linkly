import React, { useState, useRef, useEffect } from 'react';
import { Plus, LogOut, User, Settings, Code2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../types';
import { usePermission } from '../hooks/usePermission';

export type TabType = 'overview' | 'links' | 'analytics' | 'settings';

interface TopNavigationProps {
  totalClicks: number;
  clickChange: number; // percentage change
  onNewLinkClick: () => void;
  onSettingsClick?: () => void;
  currentView?: ViewState;
  onChangeView?: (view: ViewState) => void;
  onMenuClick?: () => void;
}

/** Main sections, shown as pills in the bar. Everything else is in the account menu. */
const NAV_ITEMS: { id: ViewState; label: string; tour?: string }[] = [
  { id: ViewState.DASHBOARD, label: 'Dashboard' },
  { id: ViewState.LINKS, label: 'Links' },
  { id: ViewState.PRODUCTS, label: 'Products' },
  { id: ViewState.BIO_PAGES, label: 'Bio page', tour: 'bio-nav' },
  { id: ViewState.ANALYTICS, label: 'Analytics' },
];

/** Views that belong to a pill without being one (e.g. the add-product form). */
const PARENT_VIEW: Partial<Record<ViewState, ViewState>> = {
};

const TopNavigation: React.FC<TopNavigationProps> = ({
  totalClicks,
  clickChange,
  onNewLinkClick,
  currentView,
  onChangeView,
}) => {
  const { user, signOut } = useAuth();
  const { can } = usePermission();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      navigate('/');
      // Small delay so navigation completes before auth state clears;
      // otherwise ProtectedRoute redirects to /login.
      setTimeout(async () => {
        await signOut();
      }, 50);
    } catch (error) {
      console.error('Failed to log out', error);
      setIsLoggingOut(false);
    }
  };

  const go = (view: ViewState) => {
    onChangeView?.(view);
    setIsUserMenuOpen(false);
  };

  const activeView = currentView ? PARENT_VIEW[currentView] ?? currentView : undefined;

  const pills = (
    <nav aria-label="Main" className="flex items-center gap-1 rounded-full bg-[#FBFAF8] p-1">
      {NAV_ITEMS.map(item => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => go(item.id)}
            data-tour={item.tour}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${active
              ? 'bg-[#18181A] text-[#F2F1EE]'
              : 'text-[#6E6B65] hover:bg-[#F0EEEA] hover:text-[#18181A]'}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const menuItem = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] text-[#4A4843] hover:bg-[#F0EEEA] hover:text-[#18181A]';

  return (
    <header className="sticky top-0 z-40 bg-[#ECEBE7]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <button onClick={() => go(ViewState.DASHBOARD)} className="flex shrink-0 items-center gap-2" aria-label="Gather dashboard">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#18181A]">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FF5A14]" />
          </span>
          <span className="hidden text-[17px] font-semibold tracking-tight text-[#18181A] sm:block">Gather</span>
        </button>

        {/* Section pills (desktop) */}
        <div className="hidden flex-1 justify-center md:flex">{pills}</div>
        <div className="flex-1 md:hidden" />

        {/* Clicks */}
        <div className="hidden items-center gap-2 rounded-full bg-[#FBFAF8] px-3.5 py-2 font-mono text-[12px] text-[#8C8981] lg:flex" title="Total clicks on your links">
          <span className="text-[#18181A]">{totalClicks.toLocaleString()}</span>
          <span>clicks</span>
          {clickChange !== 0 && (
            <span className="rounded-md bg-[#F0EEEA] px-1.5 py-0.5 text-[11px] text-[#C2410C]">
              {clickChange > 0 ? '+' : ''}{clickChange}%
            </span>
          )}
        </div>

        {can('create_link') && (
          <button
            onClick={onNewLinkClick}
            data-tour="create-link-button"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FF5A14] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#E64D0C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181A]"
          >
            <Plus className="h-4 w-4" />
            <span>New link</span>
          </button>
        )}

        {/* Account menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(o => !o)}
            aria-label="Account menu"
            aria-expanded={isUserMenuOpen}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#FBFAF8] text-[#6E6B65] hover:text-[#18181A]"
          >
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" />
              : <User className="h-4 w-4" />}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-[#FBFAF8] p-2 shadow-[0_12px_40px_rgba(24,24,26,0.14)] ring-1 ring-black/5">
              <div className="px-3 pb-2 pt-1.5">
                <p className="truncate text-[13px] font-medium text-[#18181A]">{user?.email}</p>
                <p className="font-mono text-[11px] capitalize text-[#8C8981]">{user?.preferences?.subscription_tier || 'free'} plan</p>
              </div>
              <div className="my-1 h-px bg-[#ECEAE6]" />
              <button onClick={() => go(ViewState.SETTINGS)} className={menuItem}><Settings className="h-4 w-4" /> Settings</button>
              <button onClick={() => go(ViewState.AFFILIATE)} className={menuItem}><Zap className="h-4 w-4" /> Affiliate tags</button>
              <button onClick={() => go(ViewState.API)} className={menuItem}><Code2 className="h-4 w-4" /> Developer API</button>
              <div className="my-1 h-px bg-[#ECEAE6]" />
              <button onClick={handleLogout} disabled={isLoggingOut} className={`${menuItem} text-[#B42318] hover:text-[#B42318]`}>
                <LogOut className="h-4 w-4" /> {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section pills (mobile): one scrollable row under the bar */}
      <div className="overflow-x-auto px-4 pb-2 md:hidden [scrollbar-width:none]">{pills}</div>
    </header>
  );
};

export default TopNavigation;
