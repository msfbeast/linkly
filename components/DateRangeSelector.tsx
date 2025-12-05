import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRange } from '../services/analyticsService';

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24hr' },
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
      <Calendar className="w-4 h-4 text-stone-400" />
      <div className="flex items-center gap-1 bg-white rounded-lg border border-stone-200 p-1 transition-colors duration-200 shadow-sm">
        {DATE_RANGE_OPTIONS.map((option) => {
          const isActive = selectedRange === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-stone-500 hover:text-slate-900 hover:bg-stone-100'
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
