import React from 'react';
import { DateRange } from '../services/analyticsService';

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string; name: string }[] = [
  { value: '24h', label: '24h', name: '24 hours' },
  { value: '7d', label: '7d', name: '7 days' },
  { value: '30d', label: '30d', name: '30 days' },
  { value: '90d', label: '90d', name: '90 days' },
  { value: 'all', label: 'All', name: 'all time' },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selectedRange, onRangeChange }) => (
  <div role="group" aria-label="Date range" className="flex items-center gap-0.5 rounded-full bg-[#FBFAF8] p-1">
    {DATE_RANGE_OPTIONS.map((option) => {
      const isActive = selectedRange === option.value;
      return (
        <button
          key={option.value}
          onClick={() => onRangeChange(option.value)}
          className={`rounded-full px-3 py-1.5 font-mono text-[12px] transition-colors ${isActive
            ? 'bg-[#18181A] text-[#F2F1EE]'
            : 'text-[#8C8981] hover:bg-[#F0EEEA] hover:text-[#18181A]'}`}
          aria-pressed={isActive}
          aria-label={`Filter by ${option.name}`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export default DateRangeSelector;
