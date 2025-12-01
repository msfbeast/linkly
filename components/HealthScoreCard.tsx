import React from 'react';
import { Activity, MoreHorizontal } from 'lucide-react';

interface HealthScoreCardProps {
    score: number;
    metrics: {
        avgClicks: number;
        growth: number;
        engagement: number;
        reach: number;
    };
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score }) => {
    return (
        <div className="w-full h-full p-6 bg-[#FDE047] rounded-[20px] font-sans flex flex-col justify-between shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="w-[35px] h-[35px] text-[#1F2937]">
                    <Activity className="w-full h-full fill-[#1F2937]" />
                </div>
                <button className="w-[40px] h-[40px] bg-[#FEF08A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#FDE68A] transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-[#1F2937]" />
                </button>
            </div>

            {/* Content */}
            <div>
                <h3 className="mt-4 font-black text-2xl text-[#1F2937]">Link Health</h3>
                <p className="mt-4 font-normal text-[15px] text-[#1F2937]/80">
                    Overall performance score based on clicks, engagement, and reach.
                </p>
            </div>

            {/* Footer / Progress */}
            <div>
                <div className="mt-8 flex justify-between items-end mb-2">
                    <span className="font-medium text-sm text-[#1F2937]">Current Score</span>
                    <span className="font-black text-xl text-[#1F2937]">{score}%</span>
                </div>

                <div className="w-full h-1 bg-[#000000]/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#1F2937] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
