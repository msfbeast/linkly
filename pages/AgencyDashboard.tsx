import React, { useEffect, useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, BarChart2, Shield, Settings, Briefcase, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const AgencyDashboard: React.FC = () => {
    const { user } = useAuth();
    const { teams, switchTeam, createTeam } = useTeam();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [newClientName, setNewClientName] = useState('');

    // Filter out "Personal Workspace" if it's represented as null/empty in some contexts,
    // but here `teams` usually contains actual Team objects. 
    // We treat them as "Clients".

    const handleSwitch = (teamId: string) => {
        switchTeam(teamId);
        navigate('/dashboard');
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeam(newClientName);
            setIsCreating(false);
            setNewClientName('');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Agency Dashboard</h1>
                        <p className="text-stone-500">Manage your client workspaces and teams from one place.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                        <Plus className="w-5 h-5" />
                        Add Client
                    </button>
                </header>

                {/* Client Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Personal Workspace Card */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                        onClick={() => {
                            switchTeam(null); // Switch to personal
                            navigate('/dashboard');
                        }}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Personal Workspace</h3>
                            <p className="text-sm text-stone-500 mb-6">Your private links and assets</p>
                            <div className="flex items-center text-indigo-600 font-bold text-sm">
                                Enter Workspace <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Client Teams */}
                    {teams.map(team => (
                        <motion.div
                            key={team.id}
                            whileHover={{ y: -4 }}
                            className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                            onClick={() => handleSwitch(team.id)}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Briefcase className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                                        {team.avatarUrl ? (
                                            <img src={team.avatarUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <span className="font-bold text-lg">{team.name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                        Client
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-1">{team.name}</h3>
                                <p className="text-sm text-stone-500 mb-6 truncate">
                                    {team.slug ? `gather.link/t/${team.slug}` : 'No custom URL'}
                                </p>

                                <div className="flex items-center gap-4 text-xs font-medium text-stone-500 mb-6 border-t border-stone-100 pt-4">
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        {team.ownerId === user?.id ? 'Owner' : 'Member'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <BarChart2 className="w-3.5 h-3.5" />
                                        Analytics
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-900 font-bold text-sm flex items-center group-hover:text-emerald-600 transition-colors">
                                        Manage Client <ArrowRight className="w-4 h-4 ml-1" />
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSwitch(team.id);
                                            // Ideally navigate to settings directly
                                            setTimeout(() => navigate('/team/settings'), 100);
                                        }}
                                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-slate-900 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Create Client Modal */}
                {isCreating && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Add New Client</h2>
                            <p className="text-stone-500 mb-6">Create a dedicated workspace for your client.</p>
                            <form onSubmit={handleCreateClient}>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Client / Company Name</label>
                                    <input
                                        type="text"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        placeholder="e.g. Acme Studio"
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-5 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                    >
                                        Create Client
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgencyDashboard;
