import React from 'react';
import { Download } from 'lucide-react';
import DateRangeSelector from '../DateRangeSelector';
import { DateRange } from '../../services/analyticsService';

interface DashboardHeaderProps {
    user: any;
    /** No links yet: greet instead of "welcome back". */
    isNew?: boolean;
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    onExport: () => void;
    isExporting: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, isNew, dateRange, setDateRange, onExport, isExporting }) => {
    const name = user?.displayName || user?.email?.split('@')[0];
    return (
        <div className="flex flex-col justify-between gap-4 pb-2 pt-4 md:flex-row md:items-end">
            <div>
                <h1 className="text-[clamp(26px,3vw,34px)] font-semibold leading-tight tracking-[-0.02em] text-[#18181A]">
                    {isNew ? (name ? `Welcome to Gather, ${name}` : 'Welcome to Gather') : (name ? `Welcome back, ${name}` : 'Welcome back')}
                </h1>
                <p className="mt-1 text-sm text-[#8C8981]">{isNew ? 'Start with your first link.' : 'How your links are doing.'}</p>
            </div>

            {!isNew && <div className="flex items-center gap-2">
                <DateRangeSelector selectedRange={dateRange} onRangeChange={setDateRange} />
                <button
                    onClick={onExport}
                    disabled={isExporting}
                    className="flex h-[38px] items-center gap-2 rounded-full bg-[#FBFAF8] px-4 text-[13px] font-medium text-[#4A4843] transition-colors hover:text-[#18181A] disabled:opacity-50"
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export CSV'}</span>
                </button>
            </div>}
        </div>
    );
};

export default DashboardHeader;
