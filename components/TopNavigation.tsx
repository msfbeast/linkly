import React, { useState, useRef, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, LogOut, User, ChevronDown, Menu } from 'lucide-react';
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

  const isPositiveChange = clickChange >= 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle logout
   * Requirements: 3.1 - Terminate session and redirect to login
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Get display email (truncate if too long)
  const getDisplayEmail = () => {
    if (!user?.email) return '';
    if (user.email.length > 24) {
      return user.email.substring(0, 21) + '...';
    }
    return user.email;
  };

  return (
    <>
      <div className="h-16 bg-[#FDFBF7] border-b border-stone-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
        {/* Left: Brand Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-lg md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center md:hidden">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gather<span className="text-yellow-400">.</span>
            </h1>
          </div>
          {/* Desktop Brand (Hidden on Mobile if Sidebar is present, but Sidebar is hidden on mobile so we show it here) */}
          <div className="hidden md:flex items-center">
            {/* Brand is in Sidebar on Desktop */}
          </div>
        </div>

        {/* Right: Clicks Display, New Link Button, and User Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Total Clicks Display (Hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-stone-200 shadow-sm">
            <span className="text-stone-500 text-sm">Total Clicks</span>
            <span className="text-slate-900 font-bold">{totalClicks.toLocaleString()}</span>
            <div className={`flex items-center gap-1 text-xs ${isPositiveChange ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositiveChange ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{isPositiveChange ? '+' : ''}{clickChange}%</span>
            </div>
          </div>

          {/* New Link Button */}
          <button
            onClick={onNewLinkClick}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg transition-colors shadow-sm shadow-yellow-300/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Link</span>
          </button>

          {/* User Menu - Requirements: 3.1 */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-2 md:px-3 rounded-lg hover:bg-stone-100 transition-colors"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''} hidden md:block`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{getUserInitials()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-sm font-bold truncate">{getDisplayEmail()}</p>
                        <p className="text-stone-500 text-xs">Free Plan</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSettingsClick?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-stone-600 hover:bg-stone-50 transition-colors text-left font-medium"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Account Settings</span>
                    </button>
                  </div>

                  {/* Logout Button - Requirements: 3.1 */}
                  <div className="border-t border-stone-100 py-2">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-50 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
