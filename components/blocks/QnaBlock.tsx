import React, { useState } from 'react';
import { WidgetVariant } from '../../types';
import { Send, MessageCircle, Check } from 'lucide-react';
import { supabaseAdapter } from '../../services/storage/supabaseAdapter';

interface QnaBlockProps {
    userId?: string;
    title?: string;
    placeholder?: string;
    variant?: WidgetVariant;
    className?: string;
}

export const QnaBlock: React.FC<QnaBlockProps> = ({
    userId,
    title = "Ask me anything",
    placeholder = "Type your question...",
    variant = 'default',
    className = ''
}) => {
    const [question, setQuestion] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setStatus('sending');
        // Simulate network request
        await new Promise(r => setTimeout(r, 800));

        // In real app: await supabaseAdapter.sendQna(userId, question);
        setStatus('sent');
        setQuestion('');

        // Reset after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
    };

    const getContainerStyles = () => {
        switch (variant) {
            case 'vibrant':
                return 'bg-yellow-400 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl text-black';
            case 'clay':
                return 'bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border-none text-slate-700';
            case 'cyberpunk':
                return 'bg-black border border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)] rounded-none text-pink-500';
            case 'glass':
                return 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white';
            case 'neubrutalism':
                return 'bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black';
            default:
                return 'bg-white border border-stone-200 rounded-2xl text-slate-900';
        }
    };

    const getInputStyles = () => {
        if (variant === 'cyberpunk') return 'bg-black border border-pink-900 text-pink-500 placeholder-pink-900 focus:border-pink-500';
        if (variant === 'glass') return 'bg-black/20 border-transparent text-white placeholder-white/50 focus:bg-black/40';
        if (variant === 'vibrant') return 'bg-white border-2 border-black text-black placeholder-stone-400 focus:ring-0';
        return 'bg-stone-50 border-stone-200 text-slate-900 placeholder-stone-400 focus:border-stone-400';
    };

    const getButtonStyles = () => {
        if (variant === 'cyberpunk') return 'bg-pink-600 hover:bg-pink-500 text-black';
        if (variant === 'glass') return 'bg-white/20 hover:bg-white/30 text-white';
        if (variant === 'vibrant') return 'bg-black text-white hover:bg-stone-800 border-2 border-black';
        return 'bg-slate-900 text-white hover:bg-slate-800';
    };

    return (
        <div className={`w-full p-6 flex flex-col justify-center h-full ${getContainerStyles()} ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 opacity-80" />
                <h3 className="font-bold text-lg leading-tight">{title}</h3>
            </div>

            {status === 'sent' ? (
                <div className="flex flex-col items-center justify-center py-4 animate-fadeIn">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                        <Check className="w-6 h-6" />
                    </div>
                    <p className="font-bold">Sent!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={placeholder}
                        disabled={status === 'sending'}
                        className={`flex-1 rounded-xl px-4 py-2 outline-none border transition-all ${getInputStyles()}`}
                    />
                    <button
                        type="submit"
                        disabled={status === 'sending' || !question.trim()}
                        className={`p-2 rounded-xl transition-all disabled:opacity-50 ${getButtonStyles()}`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            )}
        </div>
    );
};
