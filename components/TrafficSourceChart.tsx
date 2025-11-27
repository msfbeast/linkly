import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

export interface TrafficSourceDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface TrafficSourceChartProps {
  data: TrafficSourceDataPoint[];
  total: number;
}

/**
 * Calculates the sum of all traffic source values
 */
export const calculateTrafficTotal = (data: TrafficSourceDataPoint[]): number => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

const TrafficSourceChart: React.FC<TrafficSourceChartProps> = ({ data, total }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const tooltipBg = isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const tooltipTextColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipShadow = isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)';
  const legendTextColor = isDark ? '#9ca3af' : '#64748b';
  const legendValueColor = isDark ? '#6b7280' : '#94a3b8';

  return (
    <div
      className="bg-white dark:bg-[#12121a] rounded-2xl p-6 border border-slate-200 dark:border-white/5 transition-colors duration-200"
      data-testid="traffic-source-chart"
    >
      <div className="mb-4">
        <h3
          className="text-slate-900 dark:text-white text-lg font-semibold"
          data-testid="chart-title"
        >
          Traffic Source
        </h3>
        <p
          className="text-slate-500 dark:text-gray-400 text-sm"
          data-testid="chart-subtitle"
        >
          Where your clicks come from
        </p>
      </div>

      <div className="w-full h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                backdropFilter: 'blur(8px)',
                border: tooltipBorder,
                borderRadius: '12px',
                boxShadow: tooltipShadow,
              }}
              itemStyle={{ color: tooltipTextColor, fontSize: '12px' }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} clicks`,
                name,
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry) => {
                const item = data.find((d) => d.name === value);
                return (
                  <span style={{ color: legendTextColor }} className="text-sm">
                    {value}
                    {item && (
                      <span style={{ color: legendValueColor }} className="ml-2">
                        ({item.value.toLocaleString()})
                      </span>
                    )}
                  </span>
                );
              }}
              iconType="circle"
              iconSize={10}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total display */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ marginLeft: '-40px' }}
        >
          <div
            className="text-2xl font-bold text-slate-900 dark:text-white"
            data-testid="total-display"
          >
            {total.toLocaleString()}
          </div>
          <div className="text-slate-500 dark:text-gray-400 text-xs">Total</div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSourceChart;
