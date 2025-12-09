import React from 'react';
import { AudiencePersona } from '../../services/analytics/oracle';

interface AudiencePersonaCardProps {
    persona: AudiencePersona;
}

const AudiencePersonaCard: React.FC<AudiencePersonaCardProps> = ({ persona }) => {
    const getColors = (color: string) => {
        const map: Record<string, string> = {
            indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
            orange: 'bg-orange-50 border-orange-100 text-orange-600',
            blue: 'bg-blue-50 border-blue-100 text-blue-600',
            pink: 'bg-pink-50 border-pink-100 text-pink-600',
        };
        return map[color] || map.indigo;
    };

    const style = getColors(persona.color);

    return (
        <div className={`rounded-xl p-4 border relative overflow-hidden group hover:-translate-y-1 transition-transform ${style.replace('bg-', 'border-').replace('text-', '')} bg-white flex flex-col h-full`}>
            {/* Background decoration */}
            <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 ${style.split(' ')[0]} blur-xl group-hover:blur-2xl transition-all`}></div>

            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl border border-stone-100">
                    {persona.emoji}
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">{persona.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wide opacity-80 ${style.split(' ')[2]}`}>
                        {persona.matchScore}% Match
                    </span>
                </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mb-3 relative z-10 flex-1">
                {persona.description}
            </p>

            <div className="flex flex-wrap gap-1.5 relative z-10">
                {persona.traits.map(trait => (
                    <span key={trait} className="px-1.5 py-0.5 rounded-md bg-white/60 border border-stone-200 text-[9px] font-bold text-stone-500 uppercase tracking-wide">
                        {trait}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default AudiencePersonaCard;
