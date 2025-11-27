import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRange } from '../services/analyticsService';

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400" />
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#12121a] rounded-lg border border-slate-200 dark:border-white/5 p-1 transition-colors duration-200">
        {DATE_RANGE_OPTIONS.map((option) => {
          const isActive = selectedRange === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'
              }`}
              aria-pressed={isActive}
              aria-label={`Filter by ${option.label}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateRangeSelector;
