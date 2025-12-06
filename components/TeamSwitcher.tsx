import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check, User, Settings } from 'lucide-react';
import { Team } from '../types';
import { useTeam } from '../contexts/TeamContext';
import { useNavigate } from 'react-router-dom';

const TeamSwitcher: React.FC = () => {
    const { teams, currentTeam, switchTeam } = useTeam();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleSwitch = (team: Team | null) => {
        switchTeam(team ? team.id : null);
        setIsOpen(false);
        // Refresh dashboard data logic is handled by effects in pages listening to currentTeam
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
                <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {currentTeam ? currentTeam.name : 'Personal Workspace'}
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                        {currentTeam ? 'Team Plan' : 'Free Plan'}
                    </div>
                </div>
                {/* Only show Settings for Teams, or maybe allow Personal Settings too? keeping clear separation */}
                {currentTeam && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/team/settings');
                        }}
                        className="p-1 hover:bg-stone-200 rounded-full transition-colors"
                        title="Team Settings"
                    >
                        <Settings className="w-4 h-4 text-stone-400 hover:text-slate-900" />
                    </div>
                )}
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
                                        // We will add a query param or separate route for modal, 
                                        // or just use TeamSettings for creation? 
                                        // Plan said CreateTeamModal. Let's redirect to settings with 'create' intent or simple modal.
                                        // For simplicity: Go to settings page where we can have "Create New Team" section or modal trigger.
                                        // Or better: navigate to ?createTeam=true and handle in Layout.
                                        navigate('/team/settings?action=create');
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
