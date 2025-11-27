import React from 'react';
import { ExternalLink } from 'lucide-react';

export type PriorityLinkStatus = 'active' | 'expiring' | 'low-ctr';

export interface PriorityLink {
  id: string;
  title: string;
  shortCode: string;
  lastClickedAt: string;
  status: PriorityLinkStatus;
  checked: boolean;
}

export interface PriorityLinksListProps {
  links: PriorityLink[];
  onLinkToggle: (id: string) => void;
  onViewAll: () => void;
}

/**
 * Color mapping for priority link status tags
 * - active: cyan
 * - expiring: yellow
 * - low-ctr: coral
 */
export const statusColorMap: Record<PriorityLinkStatus, { bg: string; text: string }> = {
  active: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
  },
  expiring: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
  },
  'low-ctr': {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
  },
};

/**
 * Get the color configuration for a given status
 */
export function getStatusColors(status: PriorityLinkStatus) {
  return statusColorMap[status] || statusColorMap.active;
}

/**
 * Get display label for status
 */
export function getStatusLabel(status: PriorityLinkStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'expiring':
      return 'Expiring';
    case 'low-ctr':
      return 'Low CTR';
    default:
      return 'Active';
  }
}


const PriorityLinkItem: React.FC<{
  link: PriorityLink;
  onToggle: (id: string) => void;
}> = ({ link, onToggle }) => {
  const statusColors = getStatusColors(link.status);
  const statusLabel = getStatusLabel(link.status);

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-700/50 last:border-b-0"
      data-testid="priority-link-item"
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={link.checked}
        onChange={() => onToggle(link.id)}
        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
        data-testid="link-checkbox"
      />

      {/* Link info */}
      <div className="flex-1 min-w-0">
        <h4
          className="text-sm font-medium text-slate-900 dark:text-white truncate"
          data-testid="link-title"
        >
          {link.title}
        </h4>
        <p
          className="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
          data-testid="link-short-code"
        >
          link.ly/{link.shortCode}
        </p>
      </div>

      {/* Last click time */}
      <span
        className="text-xs text-slate-500 whitespace-nowrap"
        data-testid="last-click-time"
      >
        {link.lastClickedAt}
      </span>

      {/* Status tag */}
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${statusColors.bg} ${statusColors.text}`}
        data-testid="status-tag"
      >
        {statusLabel}
      </span>
    </div>
  );
};

const PriorityLinksList: React.FC<PriorityLinksListProps> = ({
  links,
  onLinkToggle,
  onViewAll,
}) => {
  return (
    <div
      className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none"
      data-testid="priority-links-list"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-slate-900 dark:text-white font-semibold">Priority Links</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Links needing attention</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-sm hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
          data-testid="view-all-button"
        >
          View All
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Links list */}
      <div className="space-y-0">
        {links.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">
            No priority links
          </p>
        ) : (
          links.map((link) => (
            <PriorityLinkItem
              key={link.id}
              link={link}
              onToggle={onLinkToggle}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PriorityLinksList;
