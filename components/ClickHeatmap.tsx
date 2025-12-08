import React, { useMemo } from 'react';
import { ClickEvent } from '../types';
import { processHeatmapData } from '../services/analyticsService';
import { ResponsiveContainer, Tooltip } from 'recharts';

interface ClickHeatmapProps {
    data: ClickEvent[];
}

export const ClickHeatmap: React.FC<ClickHeatmapProps> = ({ data }) => {
    const heatmapData = useMemo(() => processHeatmapData(data), [data]);

    // Find max value for color scaling
    const maxCount = useMemo(() => {
        let max = 0;
        heatmapData.forEach(day => {
            day.hours.forEach(hour => {
                if (hour.count > max) max = hour.count;
            });
        });
        return max || 1; // Prevent division by zero
    }, [heatmapData]);

    // Helper to get color intensity
    const getColor = (count: number) => {
        if (count === 0) return 'bg-stone-50'; // Empty
        const intensity = count / maxCount;
        if (intensity < 0.25) return 'bg-indigo-100';
        if (intensity < 0.5) return 'bg-indigo-300';
        if (intensity < 0.75) return 'bg-indigo-500';
        return 'bg-indigo-700';
    };

    return (
        <div className="w-full h-full p-6 bg-white rounded-[20px] shadow-sm border border-stone-100 font-sans flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-lg text-slate-900">Activity Heatmap</h3>
                <p className="text-sm text-stone-500">When your audience is most active (Local Time)</p>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Header Row (Hours) */}
                    <div className="flex mb-2">
                        <div className="w-16 flex-shrink-0"></div> {/* Row Label Spacer */}
                        <div className="flex-1 flex justify-between px-1">
                            {[0, 6, 12, 18].map(hour => (
                                <div key={hour} className="text-xs text-stone-400 font-medium">
                                    {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </div>
                            ))}
                            <div className="text-xs text-stone-400 font-medium">11 PM</div>
                        </div>
                    </div>

                    {/* Grid Rows */}
                    <div className="space-y-1">
                        {heatmapData.map((dayData) => (
                            <div key={dayData.day} className="flex items-center h-8">
                                {/* Day Label */}
                                <div className="w-16 text-xs font-bold text-stone-500 flex-shrink-0 text-right pr-4">
                                    {dayData.day.substring(0, 3)}
                                </div>

                                {/* Hour Cells */}
                                <div className="flex-1 flex gap-[2px] h-full">
                                    {dayData.hours.map((hourData) => (
                                        <div
                                            key={hourData.hour}
                                            className={`flex-1 rounded-sm transition-all hover:ring-2 hover:ring-indigo-400 hover:z-10 relative group ${getColor(hourData.count)}`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap">
                                                <div className="bg-slate-900 text-white text-xs py-1 px-2 rounded-lg shadow-xl">
                                                    <span className="font-bold">{hourData.count} clicks</span>
                                                    <div className="text-slate-400 text-[10px]">
                                                        {dayData.day}, {hourData.hour}:00 - {hourData.hour + 1}:00
                                                    </div>
                                                </div>
                                                {/* Tooltip Arrow */}
                                                <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-end gap-2 text-xs text-stone-500">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-sm bg-stone-50 border border-stone-100"></div>
                            <div className="w-3 h-3 rounded-sm bg-indigo-100"></div>
                            <div className="w-3 h-3 rounded-sm bg-indigo-300"></div>
                            <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
                            <div className="w-3 h-3 rounded-sm bg-indigo-700"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
