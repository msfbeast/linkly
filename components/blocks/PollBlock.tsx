import React, { useState } from 'react';
import { WidgetVariant } from '../../types';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';
import { Loader2, BarChart2 } from 'lucide-react';

interface PollBlockProps {
    pollId?: string; // In a real app, the LinkData would point to a separate Poll record
    // For MVP, we pass config directly or assume we fetch it.
    // Assuming metadata contains { question, options: [{text, votes}] } for simplicity in "Link" table mode 
    // OR we fetch from 'polls' table using link.metadata.pollId.
    // Let's go with robust metadata for now to avoid async fetching complexity in the block if possible, 
    // BUT voting needs update. So fetching is better.
    // We'll accept initial data.
    question?: string;
    options?: { id: string, text: string, votes: number }[];
    variant?: WidgetVariant;
    className?: string;
}

export const PollBlock: React.FC<PollBlockProps> = ({
    question = "What should I create next?",
    options = [
        { id: '1', text: 'Tech Review', votes: 12 },
        { id: '2', text: 'Vlog', votes: 8 },
        { id: '3', text: 'Tutorial', votes: 20 }
    ],
    variant = 'default',
    className = ''
}) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [localOptions, setLocalOptions] = useState(options);
    const [voting, setVoting] = useState<string | null>(null);

    const totalVotes = localOptions.reduce((acc, opt) => acc + opt.votes, 0);

    const handleVote = async (optionId: string) => {
        if (hasVoted || voting) return;
        setVoting(optionId);

        // Simulate API call delay
        await new Promise(r => setTimeout(r, 600));

        // Optimistic update
        setLocalOptions(prev => prev.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ));
        setHasVoted(true);
        setVoting(null);

        // Actual API call would go here: supabaseAdapter.votePoll(pollId, optionId)
    };

    const getContainerStyles = () => {
        switch (variant) {
            case 'vibrant':
                return 'bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl';
            case 'clay':
                return 'bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border-none';
            case 'cyberpunk':
                return 'bg-black border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-none';
            case 'glass':
                return 'bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl text-white';
            case 'neubrutalism':
                return 'bg-[#FFDE59] border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
            default:
                return 'bg-white border border-stone-200 rounded-2xl';
        }
    };

    const isDark = ['cyberpunk', 'glass'].includes(variant);

    return (
        <div className={`w-full p-6 flex flex-col justify-center h-full ${getContainerStyles()} ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <BarChart2 className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-stone-400'}`} />
                <h3 className={`font-bold text-lg leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {question}
                </h3>
            </div>

            <div className="space-y-3">
                {localOptions.map((opt) => {
                    const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleVote(opt.id)}
                            disabled={hasVoted || !!voting}
                            className={`relative w-full text-left p-3 rounded-xl overflow-hidden transition-all group ${isDark
                                    ? 'hover:bg-white/10'
                                    : 'hover:bg-stone-50'
                                } ${hasVoted ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                        >
                            {/* Background Bar */}
                            {hasVoted && (
                                <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out opacity-20 ${isDark ? 'bg-cyan-400' : 'bg-slate-900'
                                        }`}
                                    style={{ width: `${percent}%` }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative z-10 flex items-center justify-between">
                                <span className={`font-medium ${isDark ? 'text-stone-200' : 'text-slate-700'}`}>
                                    {opt.text}
                                </span>
                                {voting === opt.id ? (
                                    <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-cyan-400' : 'text-slate-900'}`} />
                                ) : hasVoted ? (
                                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {percent}%
                                    </span>
                                ) : (
                                    <div className={`w-4 h-4 rounded-full border-2 ${isDark ? 'border-stone-600 group-hover:border-cyan-400' : 'border-stone-300 group-hover:border-slate-900'
                                        }`} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {hasVoted && (
                <p className={`text-xs mt-4 text-center ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                    Total votes: {totalVotes}
                </p>
            )}
        </div>
    );
};
