import React, { useState, useRef, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type TabType = 'overview' | 'links' | 'analytics' | 'settings';

interface TopNavigationProps {
  totalClicks: number;
  clickChange: number; // percentage change
  onNewLinkClick: () => void;
  onSettingsClick?: () => void;
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
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    <div className="h-16 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-end px-6">
      {/* Right: Clicks Display, New Link Button, and User Menu */}
      <div className="flex items-center gap-4">
        {/* Total Clicks Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#12121a] rounded-lg border border-white/5">
          <span className="text-slate-400 text-sm">Total Clicks</span>
          <span className="text-white font-semibold">{totalClicks.toLocaleString()}</span>
          <div className={`flex items-center gap-1 text-xs ${isPositiveChange ? 'text-emerald-400' : 'text-red-400'}`}>
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
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Link</span>
        </button>

        {/* User Menu - Requirements: 3.1 */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#12121a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{getUserInitials()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{getDisplayEmail()}</p>
                      <p className="text-slate-500 text-xs">Free Plan</p>
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
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-white/5 transition-colors text-left"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Account Settings</span>
                  </button>
                </div>

                {/* Logout Button - Requirements: 3.1 */}
                <div className="border-t border-white/5 py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50"
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
  );
};

export default TopNavigation;
