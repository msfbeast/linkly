import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export interface TrafficSourceChartProps {
  data: { name: string; value: number; color: string }[];
  total?: number;
}

export const calculateTrafficTotal = (data: { value: number }[]) => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

const TrafficSourceChart: React.FC<TrafficSourceChartProps> = ({ data, total }) => {
  // Theme-aware colors for Warm Soft Minimalist
  const tooltipBg = '#ffffff';
  const tooltipBorder = '1px solid #e7e5e4';
  const tooltipTextColor = '#1c1917'; // stone-900
  const tooltipShadow = '0 4px 20px rgba(0,0,0,0.05)';

  // Custom warm palette
  const COLORS = ['#F59E0B', '#1F2937', '#78716c', '#d6d3d1', '#a8a29e'];

  return (
    <div
      className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm transition-colors duration-200"
      data-testid="traffic-source-chart"
    >
      <div className="mb-4">
        <h3
          className="text-slate-900 text-lg font-bold"
          data-testid="chart-title"
        >
          Traffic Sources
        </h3>
        <p
          className="text-stone-500 text-sm"
          data-testid="chart-subtitle"
        >
          Where your visitors are coming from
        </p>
      </div>

      <div className="w-full h-[250px] flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: tooltipBorder,
                borderRadius: '12px',
                boxShadow: tooltipShadow,
              }}
              itemStyle={{ color: tooltipTextColor, fontSize: '12px', fontWeight: 600 }}
              formatter={(value: number) => [`${value}%`, 'Share']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#78716c' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total display */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          style={{ marginTop: '10px' }}
        >
          <div className="text-2xl font-bold text-slate-900">
            {total ? total.toLocaleString() : '0'}
          </div>
          <div className="text-xs text-stone-500 font-medium">Total</div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSourceChart;
