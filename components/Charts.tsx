import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ClickEvent } from '../types';

// Helper to aggregate data for charts
export const processLinkHistory = (history: ClickEvent[] = []) => {
  // 1. Time Series (Last 7 days)
  const timeData: { name: string; clicks: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

    // Count clicks for this day
    const count = history.filter(h => {
      const hDate = new Date(h.timestamp);
      return hDate.getDate() === d.getDate() && hDate.getMonth() === d.getMonth();
    }).length;

    timeData.push({ name: dayStr, clicks: count });
  }

  // 2. Device Stats
  const devices = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 };
  history.forEach(h => {
    if (devices[h.device] !== undefined) devices[h.device]++;
    else devices['Other']++;
  });
  const deviceData = Object.keys(devices).map(k => ({
    name: k,
    value: devices[k as keyof typeof devices],
    color: k === 'Mobile' ? '#6366f1' : k === 'Desktop' ? '#a855f7' : k === 'Tablet' ? '#ec4899' : '#94a3b8'
  })).filter(d => d.value > 0);

  // 3. OS Stats
  const osStats: Record<string, number> = {};
  history.forEach(h => {
    osStats[h.os] = (osStats[h.os] || 0) + 1;
  });
  const osData = Object.keys(osStats).map((k, i) => ({
    name: k,
    value: osStats[k],
    color: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'][i % 5]
  }));

  return { timeData, deviceData, osData };
};

interface TimeChartProps {
  data: { name: string; clicks: number }[];
}

export const ClicksOverTime: React.FC<TimeChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#78716c', fontSize: 11, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#78716c', fontSize: 11 }}
          />
          <CartesianGrid vertical={false} stroke="#e7e5e4" strokeOpacity={0.6} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            itemStyle={{ color: '#1c1917', fontSize: '12px', fontWeight: 600 }}
            cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#F59E0B"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorClicks)"
            activeDot={{ r: 6, fill: '#FBBF24', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DeviceChartProps {
  data: { name: string; value: number; color: string }[];
}

export const DeviceStats: React.FC<DeviceChartProps> = ({ data }) => {
  if (data.length === 0) return <div className="text-stone-400 text-sm text-center pt-10 italic">No data recorded yet</div>;

  // Map old colors to new warm theme colors if needed, or just let them be if they fit
  const themeColors = ['#F59E0B', '#1F2937', '#78716c', '#d6d3d1'];

  return (
    <div className="w-full h-[200px] flex items-end gap-2 justify-center px-4">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
        <BarChart data={data} barSize={40}>
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            itemStyle={{ color: '#1c1917', fontSize: '12px', fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 11, fontWeight: 500 }} dy={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};