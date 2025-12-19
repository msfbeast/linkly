import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

export interface LinkHealthDataPoint {
  metric: string;
  value: number; // 0-100
  [key: string]: string | number;
}

export interface LinkHealthChartProps {
  data: LinkHealthDataPoint[];
  trendData?: { name: string; value: number }[];
}

const LinkHealthChart: React.FC<LinkHealthChartProps> = ({ data, trendData = [] }) => {
  // Calculate an overall score based on the data
  const overallScore = Math.round(
    data.reduce((acc, curr) => acc + curr.value, 0) / (data.length || 1)
  );

  // Use provided trend data or empty default
  const chartData = trendData.length > 0 ? trendData : [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
  ];

  return (
    <div className="group relative w-full h-full overflow-hidden rounded-[2rem] bg-neutral-950 p-6 font-sans shadow-2xl transition-all duration-300 hover:shadow-lime-500/10">
      {/* Background Glow Effect */}
      <div className="absolute -top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-lime-500/10 blur-3xl transition-all duration-700 group-hover:bg-lime-500/15"></div>

      <div className="relative flex flex-col h-full justify-between gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 border border-lime-400/20">
              <Activity className="h-5 w-5 text-lime-400" />
            </div>
            <div>
              <p className="font-bold text-neutral-200 text-lg">Link Health</p>
              <p className="text-xs text-neutral-500 font-medium">Updated just now</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${overallScore >= 80 ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' :
            overallScore >= 50 ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
              'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
            {overallScore >= 80 ? 'EXCELLENT' : overallScore >= 50 ? 'FAIR' : 'POOR'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="flex divide-x divide-neutral-800">
          <div className="flex-1 pr-6">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-neutral-100">{overallScore}</p>
              <span className="text-xs font-medium text-lime-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +2.4%
              </span>
            </div>
          </div>
          <div className="flex-1 pl-6">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Engagement</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-neutral-100">93%</p>
              <span className="text-xs font-medium text-lime-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +5.1%
              </span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative h-32 w-full mt-2 min-h-[128px]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                itemStyle={{ color: '#a3e635' }}
                cursor={{ stroke: '#404040' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#a3e635"
                strokeWidth={2}
                fill="url(#healthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Pulse Effect Overlay */}
          <div className="absolute right-0 top-0 pointer-events-none">
            <div className="relative">
              <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400 shadow-lg shadow-lime-400/50"></div>
              <div className="animate-ping absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400/50"></div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="border-t border-neutral-800 pt-5 mt-auto">
          <button className="w-full group flex items-center justify-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-sm font-bold text-lime-400 transition-all duration-300 hover:bg-lime-400 hover:text-neutral-950 hover:shadow-lg hover:shadow-lime-400/20">
            <Zap className="w-4 h-4 transition-transform group-hover:scale-110" />
            View Full Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkHealthChart;
