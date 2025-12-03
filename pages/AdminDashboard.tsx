import React, { useState, useEffect } from 'react';
import {
    Users,
    Link as LinkIcon,
    CreditCard,
    Activity,
    Search,
    Filter,
    MoreVertical,
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { UserProfile } from '../types';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        totalRevenue: 0, // Placeholder
        totalLinks: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const profiles = await supabaseAdapter.getAllProfiles(100);
            setUsers(profiles);

            // Calculate stats
            const activeSubs = profiles.filter(p => p.subscription_status === 'active').length;

            // Fetch total links count (this is a bit heavy, maybe optimize later)
            const links = await supabaseAdapter.getLinks(); // This only gets CURRENT user links if RLS is on. 
            // We need an admin method to get ALL links count. For now, we'll skip total links or use a placeholder.

            setStats({
                totalUsers: profiles.length,
                activeSubscriptions: activeSubs,
                totalRevenue: activeSubs * 29, // Rough estimate
                totalLinks: 0
            });
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.includes(searchQuery)
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-slate-500 mt-1">Platform overview and user management</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={Users}
                        color="blue"
                    />
                    <StatCard
                        title="Active Subscriptions"
                        value={stats.activeSubscriptions}
                        icon={CreditCard}
                        color="green"
                    />
                    <StatCard
                        title="Est. Monthly Revenue"
                        value={`$${stats.totalRevenue}`}
                        icon={Activity}
                        color="indigo"
                    />
                    <StatCard
                        title="System Health"
                        value="98%"
                        icon={Shield}
                        color="emerald"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Users</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-slate-500 font-bold text-xs">
                                                                {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{user.fullName || 'Unnamed'}</div>
                                                        <div className="text-slate-500 text-xs">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' || user.role === 'super_admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize text-slate-700 font-medium">
                                                    {user.subscription_tier || 'Free'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.subscription_status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {user.subscription_status === 'active' ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <AlertTriangle className="w-3 h-3" />
                                                    )}
                                                    {user.subscription_status || 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(user.onboardingStartedAt || Date.now()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-slate-600">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                    +12%
                </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}
