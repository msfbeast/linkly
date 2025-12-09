import React from 'react';
import { EngagementVelocity } from '../../services/analytics/oracle';
import { Rocket, Flame, TrendingUp, Minus, Snowflake } from 'lucide-react';

interface VelocityGaugeProps {
  velocity: EngagementVelocity;
}

const VelocityGauge: React.FC<VelocityGaugeProps> = ({ velocity }) => {
  const { trend, multiplier, currentCpm } = velocity;

  let color = 'text-stone-400';
  let bg = 'bg-stone-50';
  let Icon = Minus;
  let label = 'Stable';
  let needleRotation = 0;

  switch (trend) {
    case 'exploding':
      color = 'text-red-500';
      bg = 'bg-red-50';
      Icon = Rocket;
      label = 'Viral Spike';
      needleRotation = 90;
      break;
    case 'rising':
      color = 'text-orange-500';
      bg = 'bg-orange-50';
      Icon = Flame;
      label = 'Heating Up';
      needleRotation = 45;
      break;
    case 'stable':
      color = 'text-green-500';
      bg = 'bg-green-50';
      Icon = TrendingUp;
      label = 'Consistent';
      needleRotation = 0;
      break;
    case 'cooling':
      color = 'text-blue-400';
      bg = 'bg-blue-50';
      Icon = Snowflake;
      label = 'Cooling Down';
      needleRotation = -45;
      break;
    case 'cold':
      color = 'text-stone-400';
      bg = 'bg-stone-100';
      Icon = Snowflake;
      label = 'Dormant';
      needleRotation = -90;
      break;
  }

  const safeMult = Math.max(0.1, Math.min(10, multiplier || 0.1));
  const calculatedRotation = Math.log10(safeMult) * 90;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 relative overflow-hidden h-full">
      <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <h3 className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-6">Velocity</h3>

      <div className="flex flex-col items-center justify-center relative pb-4">
        {/* Speedometer Arc */}
        <div className="w-40 h-20 overflow-hidden relative">
          <div className="w-40 h-40 rounded-full border-[12px] border-stone-100 absolute top-0 left-0 border-b-0 border-l-stone-200 border-r-stone-200"></div>
          {/* Dynamic colored arc based on trend? */}
          {trend === 'exploding' && (
            <div className="w-40 h-40 rounded-full border-[12px] border-transparent absolute top-0 left-0 border-r-red-500 opacity-40 rotate-45"></div>
          )}
        </div>

        {/* Needle */}
        <div
          className="absolute bottom-4 left-1/2 w-1 h-20 origin-bottom transition-all duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${calculatedRotation}deg)` }}
        >
          <div className="w-full h-full relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-900 shadow-md"></div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-slate-900 rounded-full"></div>
          </div>
        </div>

        {/* Center Hub */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-sm z-10"></div>

        {/* Value Display */}
        <div className="mt-4 text-center">
          <div className={`text-2xl font-black ${color}`}>{multiplier}x</div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default VelocityGauge;
