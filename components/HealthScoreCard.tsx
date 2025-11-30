import React from 'react';
import { Activity, TrendingUp, Users, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricProps {
    label: string;
    value: string;
    trend?: number;
    icon: React.ElementType;
    color: string;
}

const MetricItem: React.FC<MetricProps> = ({ label, value, trend, icon: Icon, color }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs font-medium text-stone-500">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900">{value}</span>
                {trend !== undefined && (
                    <span className={`text-xs font-bold flex items-center ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    </div>
);

interface HealthScoreCardProps {
    score: number;
    metrics: {
        avgClicks: number;
        growth: number;
        engagement: number;
        reach: number;
    };
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, metrics }) => {
    // Calculate stroke dashoffset for radial progress
    const circumference = 2 * Math.PI * 36; // r=36
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-slate-900 font-bold text-lg">Link Health</h3>
                    <p className="text-stone-500 text-sm">Overall performance score</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                        score >= 50 ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                    }`}>
                    {score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-center">
                {/* Radial Progress Score */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="36"
                            stroke="#f5f5f4"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="36"
                            stroke={score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{score}</span>
                        <span className="text-xs text-stone-400 font-medium uppercase">Score</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <MetricItem
                        label="Avg Clicks"
                        value={`${metrics.avgClicks}`}
                        icon={Activity}
                        color="text-blue-500"
                    />
                    <MetricItem
                        label="Growth"
                        value={`${metrics.growth}%`}
                        trend={metrics.growth}
                        icon={TrendingUp}
                        color="text-emerald-500"
                    />
                    <MetricItem
                        label="Engagement"
                        value={`${metrics.engagement}%`}
                        icon={Clock}
                        color="text-purple-500"
                    />
                    <MetricItem
                        label="Reach"
                        value={`${metrics.reach}`}
                        icon={Users}
                        color="text-orange-500"
                    />
                </div>
            </div>
        </div>
    );
};
