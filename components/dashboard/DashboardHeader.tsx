import React from 'react';
import { Download, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import DateRangeSelector from '../DateRangeSelector';
import { DateRange } from '../../services/analyticsService';

interface DashboardHeaderProps {
    user: any;
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    onExport: () => void;
    isExporting: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    user,
    dateRange,
    setDateRange,
    onExport,
    isExporting,
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">@{user?.displayName || user?.email?.split('@')[0] || 'Creator'}</span>
                    </h1>
                </motion.div>
                <p className="text-stone-500">Here's what's happening with your links today.</p>
            </div>

            <div className="flex items-center gap-3">
                <DateRangeSelector selectedRange={dateRange} onRangeChange={setDateRange} />
                <button
                    onClick={onExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-slate-900 hover:border-stone-300 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                    <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                    <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
