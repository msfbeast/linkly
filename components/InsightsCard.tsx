import React from 'react';
import { AlertTriangle, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export type InsightType = 'warning' | 'success' | 'info' | 'neutral';

export interface Insight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

interface InsightsCardProps {
    insights: Insight[];
}

const InsightItem: React.FC<{ insight: Insight }> = ({ insight }) => {
    const getIcon = () => {
        switch (insight.type) {
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'success': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
            case 'info': return <Clock className="w-5 h-5 text-blue-500" />;
            default: return <CheckCircle2 className="w-5 h-5 text-stone-400" />;
        }
    };

    const getBgColor = () => {
        switch (insight.type) {
            case 'warning': return 'bg-amber-50 border-amber-100';
            case 'success': return 'bg-emerald-50 border-emerald-100';
            case 'info': return 'bg-blue-50 border-blue-100';
            default: return 'bg-stone-50 border-stone-100';
        }
    };

    return (
        <div className={`p-4 rounded-xl border ${getBgColor()} flex items-start gap-4`}>
            <div className="mt-0.5 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{insight.description}</p>
                {insight.actionLabel && (
                    <button
                        onClick={insight.onAction}
                        className="mt-2 text-xs font-bold flex items-center gap-1 hover:underline transition-all"
                        style={{ color: 'inherit' }}
                    >
                        {insight.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-slate-900 font-bold text-lg">Insights</h3>
                    <p className="text-stone-500 text-sm">Actionable intelligence</p>
                </div>
                <div className="flex -space-x-2">
                    {/* Placeholder for avatars or indicators if needed */}
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {insights.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-stone-300" />
                        </div>
                        <p className="text-stone-500 text-sm">Everything looks good!</p>
                    </div>
                ) : (
                    insights.map((insight) => (
                        <InsightItem key={insight.id} insight={insight} />
                    ))
                )}
            </div>
        </div>
    );
};
