import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

export interface LinkHealthDataPoint {
  metric: string;
  value: number; // 0-100
  [key: string]: string | number;
}

export interface LinkHealthChartProps {
  data: LinkHealthDataPoint[];
}

const LinkHealthChart: React.FC<LinkHealthChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const gridStroke = isDark ? '#ffffff' : '#cbd5e1';
  const gridOpacity = isDark ? 0.1 : 0.5;
  const tickColor = isDark ? '#64748b' : '#475569';
  const tooltipBg = isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const tooltipTextColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipShadow = isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)';
  const radarStroke = isDark ? '#22d3ee' : '#0891b2';
  const radarFill = isDark ? '#22d3ee' : '#0891b2';

  return (
    <div
      className="bg-white dark:bg-[#12121a] rounded-2xl p-6 border border-slate-200 dark:border-white/5 transition-colors duration-200"
      data-testid="link-health-chart"
    >
      <div className="mb-4">
        <h3
          className="text-slate-900 dark:text-white text-lg font-semibold"
          data-testid="chart-title"
        >
          Link Health
        </h3>
        <p
          className="text-slate-500 dark:text-gray-400 text-sm"
          data-testid="chart-subtitle"
        >
          Performance metrics
        </p>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid
              stroke={gridStroke}
              strokeOpacity={gridOpacity}
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: tickColor, fontSize: 9 }}
              tickCount={5}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                backdropFilter: 'blur(8px)',
                border: tooltipBorder,
                borderRadius: '12px',
                boxShadow: tooltipShadow,
              }}
              itemStyle={{ color: tooltipTextColor, fontSize: '12px' }}
              formatter={(value: number) => [`${value}%`, 'Score']}
            />
            <Radar
              name="Health"
              dataKey="value"
              stroke={radarStroke}
              fill={radarFill}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LinkHealthChart;
