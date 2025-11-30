import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, Trash2, Mail, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Team, TeamMember, TeamInvite, TeamRole } from '../types';

const TeamSettings: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invites, setInvites] = useState<TeamInvite[]>([]);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        loadTeamData();
    }, [user]);

    const loadTeamData = async () => {
        if (!user) return;
        try {
            // For now, assume single team or fetch first team
            const teams = await supabaseAdapter.getTeams();
            if (teams.length > 0) {
                const currentTeam = teams[0];
                setTeam(currentTeam);

                const [teamMembers, teamInvites] = await Promise.all([
                    supabaseAdapter.getTeamMembers(currentTeam.id),
                    // We need to implement getInvites in adapter or fetch manually
                    // For now, let's mock or skip invites fetching if not implemented
                    Promise.resolve([])
                ]);

                setMembers(teamMembers);
                // setInvites(teamInvites);
            }
        } catch (error) {
            console.error('Failed to load team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team || !inviteEmail) return;

        setInviting(true);
        try {
            await supabaseAdapter.createInvite(team.id, inviteEmail, inviteRole);
            setInviteEmail('');
            setShowInviteModal(false);
            // Reload data or add to local state
            loadTeamData();
        } catch (error) {
            console.error('Failed to invite member:', error);
            alert('Failed to send invite');
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-stone-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">No Team Found</h2>
                <p className="text-stone-500 mb-6">Create a team to start collaborating.</p>
                <button
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    onClick={() => {/* TODO: Create Team Flow */ }}
                >
                    Create Team
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team Settings</h1>
                    <p className="text-stone-500">Manage members and permissions for {team.name}</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Member</span>
                </button>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                    <h3 className="font-bold text-slate-900">Team Members ({members.length})</h3>
                </div>
                <div className="divide-y divide-stone-100">
                    {members.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between p-6 hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                    <span className="font-bold text-slate-600">
                                        {member.userId.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">
                                        {member.userId === user?.id ? 'You' : 'Team Member'}
                                    </div>
                                    <div className="text-sm text-stone-500">{member.userId}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-lg text-sm font-medium text-stone-600">
                                    <Shield className="w-3 h-3" />
                                    <span className="capitalize">{member.role}</span>
                                </div>
                                {member.role !== 'owner' && (
                                    <button className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowInviteModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                    >
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Invite Team Member</h3>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <p className="mt-2 text-xs text-stone-500">
                                    {inviteRole === 'admin' && 'Can manage team settings and members.'}
                                    {inviteRole === 'editor' && 'Can create and edit links.'}
                                    {inviteRole === 'viewer' && 'Can only view analytics.'}
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 bg-stone-100 text-slate-900 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 px-4 py-2 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                >
                                    {inviting ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default TeamSettings;
