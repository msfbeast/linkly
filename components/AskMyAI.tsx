import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { BioProfile, LinkData } from '../types';
import { chatWithProfile } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface AskMyAIProps {
    profile: BioProfile;
    links: LinkData[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

const AskMyAI: React.FC<AskMyAIProps> = ({ profile, links }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!query.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        try {
            const history = messages.map(m => m.text);
            const response = await chatWithProfile(
                {
                    displayName: profile.displayName || profile.handle,
                    bio: profile.bio || '',
                    links: links.map(l => ({ title: l.title, url: l.originalUrl, active: true }))
                },
                userMsg.text,
                history
            );

            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: 'error', role: 'assistant', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl flex items-center gap-2 font-bold transition-all ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
                    }`}
                style={{
                    background: profile.customTheme?.buttonColor || '#000000',
                    color: profile.customTheme?.buttonTextColor || '#ffffff'
                }}
            >
                <Sparkles className="w-5 h-5" />
                <span className="hidden md:inline">Ask {profile.displayName || 'Me'}</span>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Ask {profile.displayName}</h3>
                                    <p className="text-xs text-stone-500">Powered by AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-stone-400 hover:text-slate-900 hover:bg-stone-200 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                            {messages.length === 0 && (
                                <div className="text-center py-12 px-6">
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm text-stone-600 font-medium mb-1">Hi! I'm an AI assistant.</p>
                                    <p className="text-xs text-stone-500">Ask me anything about {profile.displayName}'s links, content, or background!</p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white border border-stone-100 shadow-sm text-slate-800 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white border border-stone-100 shadow-sm p-3 rounded-2xl rounded-tl-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-stone-100">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isLoading}
                                    className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AskMyAI;
