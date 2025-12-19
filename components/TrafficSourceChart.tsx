import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PieChart as PieChartIcon, MoreHorizontal } from 'lucide-react';

export interface TrafficSourceChartProps {
  data: { name: string; value: number; color: string }[];
  total?: number;
}

export const calculateTrafficTotal = (data: { value: number }[]) => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

const TrafficSourceChart: React.FC<TrafficSourceChartProps> = ({ data, total }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Custom palette for yellow theme - softer darks
  const COLORS = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF'];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div
      className="w-full h-full p-6 bg-[#FDE047] rounded-[2rem] font-sans flex flex-col shadow-xl transition-transform duration-300 hover:scale-[1.02]"
      data-testid="traffic-source-chart"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="w-[35px] h-[35px] text-[#1F2937]">
          <PieChartIcon className="w-full h-full fill-[#1F2937]" />
        </div>
        <button className="w-[40px] h-[40px] bg-[#FEF08A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#FDE68A] transition-colors">
          <MoreHorizontal className="w-5 h-5 text-[#1F2937]" />
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-black text-2xl text-[#1F2937]" data-testid="chart-title">Traffic Sources</h3>
        <p className="text-sm text-[#1F2937]/70 font-medium" data-testid="chart-subtitle">Where your clicks come from</p>
      </div>

      <div className="flex-1 relative min-h-[250px] w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#1F2937' }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Display - Absolute positioning to center in the donut hole */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
          {activeItem ? (
            <>
              <div className="text-[10px] text-[#1F2937]/70 font-bold uppercase tracking-wider mb-0.5">
                {activeItem.name}
              </div>
              <div className="text-2xl font-black text-[#1F2937] leading-none">
                {activeItem.value}%
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] text-[#1F2937]/70 font-bold uppercase tracking-wider mb-0.5">
                Total
              </div>
              <div
                className="text-2xl font-black text-[#1F2937] leading-none"
                data-testid="total-display"
              >
                {total ? total.toLocaleString() : '0'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficSourceChart;
