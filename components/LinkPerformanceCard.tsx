import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export type LinkCategory = 'social' | 'marketing' | 'product' | 'other';

export interface LinkPerformanceCardProps {
  category: LinkCategory;
  title: string;
  shortCode: string;
  createdAt: string;
  clicks: number;
  onMenuClick: () => void;
}

/**
 * Color mapping for link categories
 * - social: cyan (solid)
 * - marketing: yellow (solid)
 * - product: coral/pink (solid)
 * - other: theme-aware (light gray in light mode, dark in dark mode)
 */
export const categoryColorMap: Record<LinkCategory, { bg: string; text: string; label: string; clicksText: string; isThemeAware?: boolean }> = {
  social: {
    bg: 'bg-cyan-500',
    text: 'text-white',
    label: 'bg-cyan-600/50 text-cyan-100',
    clicksText: 'text-white',
  },
  marketing: {
    bg: 'bg-yellow-500',
    text: 'text-slate-900',
    label: 'bg-yellow-600/50 text-yellow-900',
    clicksText: 'text-slate-900',
  },
  product: {
    bg: 'bg-pink-500',
    text: 'text-white',
    label: 'bg-pink-600/50 text-pink-100',
    clicksText: 'text-white',
  },
  other: {
    bg: 'bg-slate-100 dark:bg-[#1a1a24]',
    text: 'text-slate-900 dark:text-white',
    label: 'bg-slate-300/50 dark:bg-slate-600/50 text-slate-700 dark:text-slate-300',
    clicksText: 'text-slate-900 dark:text-white',
    isThemeAware: true,
  },
};

/**
 * Get the color configuration for a given category
 */
export function getCategoryColors(category: LinkCategory) {
  return categoryColorMap[category] || categoryColorMap.other;
}

const LinkPerformanceCard: React.FC<LinkPerformanceCardProps> = ({
  category,
  title,
  shortCode,
  createdAt,
  clicks,
  onMenuClick,
}) => {
  const colors = getCategoryColors(category);
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const isLightBg = category === 'marketing';
  const isThemeAware = colors.isThemeAware;

  // Menu button styles based on background type
  const getMenuButtonStyles = () => {
    if (isLightBg) {
      return 'text-slate-700 hover:text-slate-900 hover:bg-black/10';
    }
    if (isThemeAware) {
      return 'text-slate-500 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10';
    }
    return 'text-white/70 hover:text-white hover:bg-white/10';
  };

  // Date text styles based on background type
  const getDateStyles = () => {
    if (isLightBg) {
      return 'text-slate-700/70';
    }
    if (isThemeAware) {
      return 'text-slate-500 dark:text-white/70';
    }
    return 'text-white/70';
  };

  return (
    <div
      className={`${colors.bg} rounded-2xl p-5 relative group transition-all hover:scale-[1.02] min-h-[160px] ${isThemeAware ? 'border border-slate-200 dark:border-transparent shadow-sm dark:shadow-none' : ''}`}
      data-testid="link-performance-card"
    >
      {/* Three-dot menu button */}
      <button
        onClick={onMenuClick}
        className={`absolute top-4 right-4 p-1.5 rounded-lg ${getMenuButtonStyles()} transition-all opacity-0 group-hover:opacity-100`}
        aria-label="Menu"
        data-testid="menu-button"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Category label */}
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.label}`}
        data-testid="category-label"
      >
        {categoryLabel}
      </span>

      {/* Title */}
      <h3
        className={`mt-3 text-xl font-bold ${colors.text} truncate`}
        data-testid="card-title"
      >
        {title}
      </h3>

      {/* Date info */}
      <p className={`${getDateStyles()} text-sm mt-1`} data-testid="created-date">
        {createdAt}
      </p>

      {/* Clicks - large display at bottom */}
      <div className="mt-4">
        <span className={`text-2xl font-bold ${colors.clicksText}`} data-testid="click-count">
          {clicks.toLocaleString()} clicks
        </span>
      </div>
    </div>
  );
};

export default LinkPerformanceCard;
