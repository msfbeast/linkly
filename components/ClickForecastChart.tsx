import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

export interface ClickForecastChartProps {
  data: {
    date: string;
    actual: number;
    forecast: number;
  }[];
}

const ClickForecastChart: React.FC<ClickForecastChartProps> = ({ data }) => {
  // Theme-aware colors for Warm Soft Minimalist
  const gridStroke = '#e7e5e4'; // stone-200
  const gridOpacity = 0.6;
  const tickColor = '#78716c'; // stone-500
  const tooltipBg = '#ffffff';
  const tooltipBorder = '1px solid #e7e5e4';
  const tooltipTextColor = '#1c1917'; // stone-900
  const tooltipShadow = '0 4px 20px rgba(0,0,0,0.05)';
  const actualStroke = '#1F2937'; // slate-900 (charcoal)
  const forecastStroke = '#F59E0B'; // yellow-500
  const forecastFill = 'url(#colorForecast)';

  return (
    <div className="w-full h-full min-h-[200px]" data-testid="click-forecast-chart">

      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke={gridStroke}
            strokeOpacity={gridOpacity}
          />
          <XAxis
            dataKey="date"
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
              border: tooltipBorder,
              borderRadius: '12px',
              boxShadow: tooltipShadow,
            }}
            itemStyle={{ color: tooltipTextColor, fontSize: '12px', fontWeight: 600 }}
            cursor={{ stroke: '#F59E0B', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#78716c' }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual Clicks"
            stroke={actualStroke}
            strokeWidth={3}
            fill="transparent"
            activeDot={{ r: 6, fill: '#1F2937', stroke: '#fff', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke={forecastStroke}
            strokeWidth={3}
            strokeDasharray="5 5"
            fill={forecastFill}
            activeDot={{ r: 6, fill: '#FBBF24', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClickForecastChart;
