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
    bg: 'bg-white border border-stone-200',
    text: 'text-slate-900',
    label: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    clicksText: 'text-slate-900',
  },
  marketing: {
    bg: 'bg-yellow-400',
    text: 'text-slate-900',
    label: 'bg-white/30 text-yellow-900 border border-yellow-500/20',
    clicksText: 'text-slate-900',
  },
  product: {
    bg: 'bg-white border border-stone-200',
    text: 'text-slate-900',
    label: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    clicksText: 'text-slate-900',
  },
  other: {
    bg: 'bg-white border border-stone-200',
    text: 'text-slate-900',
    label: 'bg-stone-100 text-stone-600 border border-stone-200',
    clicksText: 'text-slate-900',
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
    if (category === 'marketing') {
      return 'text-yellow-900 hover:bg-black/5';
    }
    return 'text-stone-400 hover:text-slate-900 hover:bg-stone-100';
  };

  // Date text styles based on background type
  const getDateStyles = () => {
    if (category === 'marketing') {
      return 'text-yellow-800/70';
    }
    return 'text-stone-400';
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
