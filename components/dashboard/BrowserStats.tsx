import React from 'react';
import { motion } from 'framer-motion';

interface BrowserData {
    name: string;
    value: number;
    icon?: React.ReactNode;
}

interface BrowserStatsProps {
    data: BrowserData[];
}

export const BrowserStats: React.FC<BrowserStatsProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Top Browsers</h3>
            <div className="space-y-4">
                {data.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                        <div key={item.name} className="relative">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-slate-700">{item.name}</span>
                                <span className="text-stone-500">{item.value.toLocaleString()} ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && (
                    <div className="text-center text-stone-400 py-8">
                        No browser data available yet
                    </div>
                )}
            </div>
        </div>
    );
};
