import React from 'react';
import { Lightbulb, MoreHorizontal, ArrowRight } from 'lucide-react';

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

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
    // Take only the top 3 insights to fit the card
    const displayInsights = insights.slice(0, 3);

    return (
        <div className="w-full h-full p-6 bg-[#FDE047] rounded-[20px] font-sans flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="w-[35px] h-[35px] text-[#1F2937]">
                    <Lightbulb className="w-full h-full fill-[#1F2937]" />
                </div>
                <button className="w-[40px] h-[40px] bg-[#FEF08A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#FDE68A] transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-[#1F2937]" />
                </button>
            </div>

            <h3 className="font-black text-2xl text-[#1F2937] mb-4">Insights</h3>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {displayInsights.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <p className="text-[#1F2937] font-medium">No new insights</p>
                    </div>
                ) : (
                    displayInsights.map((insight) => (
                        <div key={insight.id} className="bg-[#1F2937]/5 p-3 rounded-xl border border-[#1F2937]/5">
                            <h4 className="font-bold text-[#1F2937] text-sm">{insight.title}</h4>
                            <p className="text-xs text-[#1F2937]/80 mt-1 line-clamp-2">{insight.description}</p>
                            {insight.actionLabel && (
                                <button
                                    onClick={insight.onAction}
                                    className="mt-2 text-xs font-bold text-[#1F2937] flex items-center gap-1 hover:opacity-70 transition-opacity"
                                >
                                    {insight.actionLabel} <ArrowRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
