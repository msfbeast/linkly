import React from 'react';
import { CreatorRank } from '../../services/analytics/oracle';
import { Crown, Award, Star, Zap } from 'lucide-react';

interface RankBadgeProps {
    rank: CreatorRank;
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
    let bg = 'bg-orange-100';
    let text = 'text-orange-700';
    let border = 'border-orange-200';
    let Icon = Award;
    let shine = 'after:bg-orange-400';

    if (rank.level === 'Silver') {
        bg = 'bg-slate-100';
        text = 'text-slate-700';
        border = 'border-slate-200';
        Icon = Star;
        shine = 'after:bg-slate-400';
    } else if (rank.level === 'Gold') {
        bg = 'bg-yellow-50';
        text = 'text-yellow-700';
        border = 'border-yellow-200';
        Icon = Crown;
        shine = 'after:bg-yellow-400';
    } else if (rank.level === 'Platinum') {
        bg = 'bg-cyan-50';
        text = 'text-cyan-700';
        border = 'border-cyan-200';
        Icon = Zap;
        shine = 'after:bg-cyan-400';
    }

    return (
        <div className={`h-full bg-white border ${border} rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center`}>
            {/* Shiny effect */}
            <div className={`absolute top-0 left-0 w-full h-1 ${bg}`}></div>

            <div className={`w-16 h-16 rounded-full ${bg} ${text} flex items-center justify-center mb-4 shadow-sm border-4 border-white ring-1 ring-stone-100`}>
                <Icon className="w-8 h-8" />
            </div>

            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-1">Creator Rank</h3>
            <h2 className={`text-3xl font-black ${text} mb-2`}>{rank.level}</h2>

            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-2 relative">
                <div className={`h-full ${bg} ${text} bg-current brightness-125 transition-all duration-1000`} style={{ width: `${rank.progressToNext}%` }}></div>
            </div>
            <p className="text-xs text-stone-400">Top {rank.percentile}% · {Math.round(100 - rank.progressToNext)}% to {rank.nextMilestone}</p>

            <div className="mt-4 flex gap-2">
                {rank.badges.map(b => (
                    <span key={b} className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-md text-[10px] font-bold text-stone-500 uppercase">{b}</span>
                ))}
            </div>
        </div>
    );
};

export default RankBadge;
