import React, { useState, useRef, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, LogOut, User, ChevronDown, Menu, ShoppingBag, LayoutDashboard, Link as LinkIcon, BarChart2, Settings, Code2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MobileMenu from './MobileMenu';
import { ViewState } from '../types';

export type TabType = 'overview' | 'links' | 'analytics' | 'settings';

interface TopNavigationProps {
  totalClicks: number;
  clickChange: number; // percentage change
  onNewLinkClick: () => void;
  onSettingsClick?: () => void;
  currentView?: ViewState;
  onChangeView?: (view: ViewState) => void;
}

/**
 * Top Navigation Component
 * Displays navigation tabs, click stats, and user menu
 * Requirements: 3.1 - Logout functionality
 */
const TopNavigation: React.FC<TopNavigationProps> = ({
  totalClicks,
  clickChange,
  onNewLinkClick,
  onSettingsClick,
  currentView,
  onChangeView,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.PRODUCTS, label: 'Products', icon: ShoppingBag },
    { id: ViewState.LINKS, label: 'Links', icon: LinkIcon },
    { id: ViewState.ANALYTICS, label: 'Analytics', icon: BarChart2 },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <div className="h-16 bg-[#FDFBF7] border-b border-stone-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
        {/* Left: Logo and Tabs */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo - Only visible on mobile since Sidebar has it on desktop */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4 text-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">Gather<span className="text-yellow-500">.</span></h1>
          </div>
        </div>

        {/* Right: Clicks Display, New Link Button, and User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Total Clicks Display (Hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-stone-200 shadow-sm">
            <div className={`p-1.5 rounded-lg ${clickChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {clickChange >= 0 ? (
                <TrendingUp className={`w-4 h-4 ${clickChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider leading-none mb-1">Total Clicks</div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-bold text-slate-900">{totalClicks.toLocaleString()}</span>
                {clickChange !== 0 && (
                  <span className={`text-xs font-bold ${clickChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {clickChange > 0 ? '+' : ''}{clickChange}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* New Link Button */}
          <button
            onClick={onNewLinkClick}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-yellow-400/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Link</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-stone-100 rounded-xl transition-colors border border-transparent hover:border-stone-200"
            >
              <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center overflow-hidden border border-stone-300">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-stone-500" />
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                  <p className="text-xs text-stone-500">Free Plan</p>
                </div>
                <button
                  onClick={() => {
                    onChangeView?.(ViewState.SETTINGS);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-slate-900 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <div className="border-t border-stone-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {currentView && onChangeView && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentView={currentView}
          onChangeView={onChangeView}
        />
      )}
    </>
  );
};

export default TopNavigation;
