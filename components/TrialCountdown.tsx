import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const TrialCountdown: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user?.preferences?.trial_ends_at || user.preferences.subscription_status !== 'trial') {
        return null;
    }

    const trialEnd = new Date(user.preferences.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3 shadow-md"
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-1.5 rounded-lg">
                        <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium">
                        <span className="text-amber-400 font-bold">{daysLeft} days left</span> in your Pro trial.
                        <span className="text-slate-400 ml-1 hidden sm:inline">Enjoying the advanced features?</span>
                    </p>
                </div>

                <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-1"
                >
                    Upgrade Now <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
};
