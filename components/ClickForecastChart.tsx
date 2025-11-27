import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

export interface ClickForecastDataPoint {
  day: string;
  forecast: number;
  actual: number;
}

export interface ClickForecastChartProps {
  data: ClickForecastDataPoint[];
}

const ClickForecastChart: React.FC<ClickForecastChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const gridStroke = isDark ? '#ffffff' : '#e2e8f0';
  const gridOpacity = isDark ? 0.05 : 0.5;
  const tickColor = isDark ? '#64748b' : '#475569';
  const tooltipBg = isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const tooltipTextColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipShadow = isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)';
  const cursorFill = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const forecastColor = isDark ? '#22d3ee' : '#0891b2';

  return (
    <div
      className="bg-white dark:bg-[#12121a] rounded-2xl p-6 border border-slate-200 dark:border-white/5 transition-colors duration-200"
      data-testid="click-forecast-chart"
    >
      <div className="mb-4">
        <h3
          className="text-slate-900 dark:text-white text-lg font-semibold"
          data-testid="chart-title"
        >
          Click Forecast
        </h3>
        <p
          className="text-slate-500 dark:text-gray-400 text-sm"
          data-testid="chart-subtitle"
        >
          Projected engagement via analytics
        </p>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              vertical={false}
              stroke={gridStroke}
              strokeOpacity={gridOpacity}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11 }}
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
              cursor={{ fill: cursorFill }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-slate-500 dark:text-gray-400 text-sm capitalize">{value}</span>
              )}
            />
            <Bar
              dataKey="forecast"
              name="Forecast"
              fill={forecastColor}
              radius={[4, 4, 0, 0]}
              data-testid="forecast-series"
            />
            <Bar
              dataKey="actual"
              name="Actual"
              fill="#6b7280"
              radius={[4, 4, 0, 0]}
              data-testid="actual-series"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ClickForecastChart;
