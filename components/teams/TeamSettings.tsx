import React, { useState, useEffect } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, X, Shield, Trash2, Check, Copy } from 'lucide-react';

const TeamSettings: React.FC = () => {
    const { currentTeam, createTeam, userRole, createInvite } = useTeam();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(action === 'create');
    const [newTeamName, setNewTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');

    // If param changes, open modal
    useEffect(() => {
        if (action === 'create') setIsCreateModalOpen(true);
    }, [action]);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeam(newTeamName);
            setIsCreateModalOpen(false);
            setNewTeamName('');
        } catch (error) {
            console.error(error);
            alert('Failed to create team');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createInvite(inviteEmail, inviteRole);
            setInviteEmail('');
            alert('Invite sent!');
        } catch (error) {
            console.error(error);
            alert('Failed to send invite');
        }
    };

    if (!currentTeam && !isCreateModalOpen) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Personal Workspace</h2>
                <p className="text-stone-500 mb-8">You are currently in your personal workspace. Links here are private to you.</p>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
                >
                    Create a Team
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{currentTeam?.name}</h1>
                    <p className="text-stone-500">Manage members and settings</p>
                </div>
                {userRole === 'owner' && (
                    <button className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                        Delete Team
                    </button>
                )}
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Members
                    </h2>
                    <button
                        className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors flex items-center gap-2"
                        onClick={() => {/* Open invite modal or focus input */ }}
                    >
                        <Plus className="w-4 h-4" />
                        Invite Member
                    </button>
                </div>

                {/* Invite Form */}
                <form onSubmit={handleInvite} className="bg-stone-50 p-4 rounded-xl mb-6 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-stone-500 mb-1">EMAIL ADDRESS</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-stone-500 mb-1">ROLE</label>
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold h-[42px]">
                        Send
                    </button>
                </form>

                {/* Member List (Placeholder for now, would map over real members) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                ME
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">You (Owner)</div>
                                <div className="text-xs text-stone-500">user@example.com</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Owner</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Team Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Team</h2>
                                <p className="text-stone-500 mb-6">Create a shared workspace for your organization.</p>

                                <form onSubmit={handleCreateTeam}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-slate-900 mb-2">
                                            Team Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newTeamName}
                                            onChange={e => setNewTeamName(e.target.value)}
                                            placeholder="Acme Corp"
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                        >
                                            Create Team
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamSettings;
