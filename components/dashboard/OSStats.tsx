import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface OSData {
    name: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface OSStatsProps {
    data: OSData[];
}

const COLORS: Record<string, string> = {
    'iOS': '#000000',
    'Android': '#10B981', // Emerald 500
    'Windows': '#3B82F6', // Blue 500
    'macOS': '#64748B',   // Slate 500
    'Linux': '#F59E0B',   // Amber 500
    'Other': '#E2E8F0',   // Slate 200
    'Unknown': '#E2E8F0'
};

export const OSStats: React.FC<OSStatsProps> = ({ data }) => {
    // Merge data with refined colors
    const chartData = data.map(d => ({
        ...d,
        color: COLORS[d.name] || d.color || COLORS['Other']
    })).sort((a, b) => b.value - a.value); // Sort by value

    const totalClicks = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="bg-white rounded-[2rem] p-6 pb-10 border border-stone-200 shadow-sm flex flex-col min-h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 card-hover relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 z-10">
                Operating Systems
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full h-full">
                <div className="relative w-full h-[250px] flex items-center justify-center">
                    {/* Centered Total - Rendered FIRST (Behind Chart) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-slate-900 leading-none">
                            {totalClicks.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Clicks</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius="60%"
                                outerRadius="85%"
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={6}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl border border-slate-700 z-50">
                                                <span className="font-bold">{data.name}</span>
                                                <div className="text-slate-300">{data.value.toLocaleString()} clicks</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend - Tighter Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 w-full px-4">
                    {chartData.slice(0, 8).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-medium text-stone-600 truncate">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{item.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
