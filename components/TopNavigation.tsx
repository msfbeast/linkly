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
      navigate('/');
      // Small delay to ensure navigation completes before auth state clears
      // This prevents ProtectedRoute from triggering a redirect to /login
      setTimeout(async () => {
        await signOut();
      }, 50);
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

  const checklistItems = [
    { id: 'signup', label: 'Create your account', completed: true },
    { id: 'first-link', label: 'Create your first link', completed: totalClicks > 0 || clickChange !== 0 }, // Simplified check
    { id: 'customize', label: 'Customize your profile', completed: !!user?.user_metadata?.avatar_url },
    { id: 'share', label: 'Share your link', completed: totalClicks > 5 },
  ];

  const completedCount = checklistItems.filter(i => i.completed).length;
  const progress = (completedCount / checklistItems.length) * 100;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div className="h-20 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 bg-[#FDFBF7]/80 backdrop-blur-md">
        {/* Left: Logo and Tabs */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo - Only visible on mobile since Sidebar has it on desktop */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block tracking-tight">Gather<span className="text-yellow-500">.</span></h1>
          </div>
        </div>

        {/* Right: Clicks Display, New Link Button, and User Menu */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Total Clicks Display */}
          <div className="hidden sm:flex items-center gap-3 px-2">
            <div className={`p-2 rounded-full ${clickChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {clickChange >= 0 ? (
                <TrendingUp className={`w-4 h-4 ${clickChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider leading-none mb-0.5">Total Clicks</span>
              <div className="flex items-baseline gap-2 leading-none">
                <span className="text-lg font-bold text-slate-900">{totalClicks.toLocaleString()}</span>
                {clickChange !== 0 && (
                  <span className={`text-xs font-bold ${clickChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {clickChange > 0 ? '+' : ''}{clickChange}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-stone-200 hidden sm:block"></div>

          {/* New Link Button */}
          <button
            onClick={onNewLinkClick}
            className="flex items-center gap-2 px-5 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Link</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative flex items-center justify-center w-12 h-12 rounded-full hover:bg-stone-100 transition-colors"
            >
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  stroke="#9333EA"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center overflow-hidden border border-stone-300 relative z-10">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-stone-500" />
                )}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50">
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                  <p className="text-xs text-stone-500">Free Plan</p>
                </div>

                {/* Setup Checklist */}
                <div className="px-4 py-3 border-b border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Setup Progress</span>
                    <span className="text-xs font-bold text-purple-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${item.completed ? 'bg-purple-100 border-purple-200' : 'border-stone-200'}`}>
                          {item.completed && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                        </div>
                        <span className={`text-xs ${item.completed ? 'text-stone-400 line-through' : 'text-stone-600'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
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
