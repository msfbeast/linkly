import React, { useState, useEffect } from 'react';
import { Download, Mail, Trash2, Loader2, Users } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { NewsletterSubscriber } from '../types';

export const NewsletterManager: React.FC = () => {
    const { user } = useAuth();
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchSubscribers();
        }
    }, [user?.id]);

    const fetchSubscribers = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await supabaseAdapter.getSubscribers(user.id);
            setSubscribers(data);
        } catch (err) {
            console.error('Error fetching subscribers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this subscriber?')) return;
        try {
            await supabaseAdapter.deleteSubscriber(id);
            setSubscribers(prev => prev.filter(sub => sub.id !== id));
        } catch (err) {
            console.error('Error deleting subscriber:', err);
        }
    };

    const handleExport = () => {
        const csvContent = [
            ['Email', 'Joined At'],
            ...subscribers.map(sub => [
                sub.email,
                new Date(sub.createdAt).toISOString()
            ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Newsletter Subscribers</h3>
                    <p className="text-sm text-stone-500">Manage and export your email list.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={subscribers.length === 0}
                    className="bg-white border border-stone-200 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-stone-300 animate-spin" />
                </div>
            ) : subscribers.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-stone-400" />
                    </div>
                    <h4 className="text-stone-900 font-bold mb-1">No subscribers yet</h4>
                    <p className="text-stone-500 text-sm">Add the Newsletter Block to your Bio Page to start collecting emails.</p>
                </div>
            ) : (
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-3 font-bold text-stone-500">Email</th>
                                <th className="px-6 py-3 font-bold text-stone-500">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-stone-400" />
                                        {sub.email}
                                    </td>
                                    <td className="px-6 py-4 text-stone-500">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="text-stone-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
