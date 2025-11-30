import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Users, Check, User } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Team } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeamSwitcher: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

    useEffect(() => {
        loadTeams();
    }, [user]);

    const loadTeams = async () => {
        if (!user) return;
        const userTeams = await supabaseAdapter.getTeams();
        setTeams(userTeams);
        // Default to first team if exists for now, or use context/local storage
        if (userTeams.length > 0) {
            setCurrentTeam(userTeams[0]);
        }
    };

    const handleSwitch = (team: Team | null) => {
        setCurrentTeam(team);
        setIsOpen(false);
        // TODO: Update global context or trigger reload of data
        // For now, just navigate to dashboard to refresh
        navigate('/dashboard');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-stone-100 transition-colors text-left"
            >
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {currentTeam ? currentTeam.name.substring(0, 2).toUpperCase() : 'ME'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                        {currentTeam ? currentTeam.name : 'Personal Workspace'}
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                        {currentTeam ? 'Team Plan' : 'Free Plan'}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 z-50 overflow-hidden"
                        >
                            <div className="p-2">
                                <div className="text-xs font-bold text-stone-400 px-2 py-1 uppercase tracking-wider">
                                    Personal
                                </div>
                                <button
                                    onClick={() => handleSwitch(null)}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                                        <User className="w-4 h-4 text-stone-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-slate-900">Personal</div>
                                    </div>
                                    {!currentTeam && <Check className="w-4 h-4 text-green-500" />}
                                </button>

                                {teams.length > 0 && (
                                    <>
                                        <div className="h-px bg-stone-100 my-2" />
                                        <div className="text-xs font-bold text-stone-400 px-2 py-1 uppercase tracking-wider">
                                            Teams
                                        </div>
                                        {teams.map((team) => (
                                            <button
                                                key={team.id}
                                                onClick={() => handleSwitch(team)}
                                                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-stone-50 transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-indigo-600">
                                                        {team.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium text-slate-900 truncate">
                                                        {team.name}
                                                    </div>
                                                </div>
                                                {currentTeam?.id === team.id && <Check className="w-4 h-4 text-green-500" />}
                                            </button>
                                        ))}
                                    </>
                                )}

                                <div className="h-px bg-stone-100 my-2" />
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // TODO: Open Create Team Modal
                                        navigate('/team/settings');
                                    }}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-stone-50 transition-colors text-stone-500 hover:text-slate-900"
                                >
                                    <div className="w-8 h-8 border border-dashed border-stone-300 rounded-lg flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">Create Team</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamSwitcher;
