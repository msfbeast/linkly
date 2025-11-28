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
  // Theme-aware colors for Warm Soft Minimalist
  const gridStroke = '#e7e5e4'; // stone-200
  const gridOpacity = 0.6;
  const tickColor = '#78716c'; // stone-500
  const tooltipBg = '#ffffff';
  const tooltipBorder = '1px solid #e7e5e4';
  const tooltipTextColor = '#1c1917'; // stone-900
  const tooltipShadow = '0 4px 20px rgba(0,0,0,0.05)';
  const radarStroke = '#F59E0B'; // yellow-500
  const radarFill = '#F59E0B'; // yellow-500

  return (
    <div
      className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm transition-colors duration-200"
      data-testid="link-health-chart"
    >
      <div className="mb-4">
        <h3
          className="text-slate-900 text-lg font-bold"
          data-testid="chart-title"
        >
          Link Health
        </h3>
        <p
          className="text-stone-500 text-sm"
          data-testid="chart-subtitle"
        >
          Performance metrics
        </p>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                border: tooltipBorder,
                borderRadius: '12px',
                boxShadow: tooltipShadow,
              }}
              itemStyle={{ color: tooltipTextColor, fontSize: '12px', fontWeight: 600 }}
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
