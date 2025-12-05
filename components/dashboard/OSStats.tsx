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

const COLORS = {
    'iOS': '#000000',      // Black
    'Android': '#3DDC84',  // Android Green
    'Windows': '#00A4EF',  // Windows Blue
    'macOS': '#666666',    // Grey
    'Linux': '#FCC624',    // Yellow
    'Other': '#d6d3d1'     // Stone-300
};

export const OSStats: React.FC<OSStatsProps> = ({ data }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Operating Systems</h3>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), 'Clicks']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
