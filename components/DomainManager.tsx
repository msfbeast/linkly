import React, { useState, useEffect } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Domain } from '../types';
import { Plus, Globe, CheckCircle2, AlertCircle, Trash2, RefreshCw, Copy, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DomainManagerProps {
    userId: string;
}

const DomainManager: React.FC<DomainManagerProps> = ({ userId }) => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDomains();
    }, [userId]);

    const fetchDomains = async () => {
        try {
            setLoading(true);
            const data = await supabaseAdapter.getDomains(userId);
            setDomains(data);
        } catch (err) {
            console.error('Error fetching domains:', err);
            setError('Failed to load domains');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain) return;

        // Basic validation
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(newDomain)) {
            setError('Please enter a valid domain name (e.g., links.example.com)');
            return;
        }

        try {
            setLoading(true);
            await supabaseAdapter.addDomain(userId, newDomain);
            setNewDomain('');
            setIsAdding(false);
            setError(null);
            fetchDomains();
        } catch (err) {
            console.error('Error adding domain:', err);
            setError('Failed to add domain');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            setVerifyingId(id);
            const updatedDomain = await supabaseAdapter.verifyDomain(id);
            if (updatedDomain) {
                setDomains(prev => prev.map(d => d.id === id ? updatedDomain : d));
            } else {
                setError('Verification failed. Please check your DNS records and try again.');
            }
        } catch (err) {
            console.error('Error verifying domain:', err);
            setError('Verification failed');
        } finally {
            setVerifyingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this domain?')) return;

        try {
            await supabaseAdapter.removeDomain(id);
            setDomains(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('Error removing domain:', err);
            setError('Failed to remove domain');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Custom Domains</h2>
                    <p className="text-stone-500 text-sm">Connect your own domains to brand your links.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Domain
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:text-red-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleAddDomain}
                        className="bg-stone-50 border border-stone-200 p-6 rounded-2xl space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Domain Name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                                    placeholder="e.g. links.mybrand.com"
                                    className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-stone-500 hover:text-slate-900 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !newDomain}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                </button>
                            </div>
                            <p className="text-xs text-stone-500 mt-2">
                                We recommend using a subdomain like <code>links.yourdomain.com</code> or <code>go.yourdomain.com</code>.
                            </p>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid gap-4">
                {domains.map((domain) => (
                    <div
                        key={domain.id}
                        className="bg-white border border-stone-200 rounded-2xl p-6 transition-all hover:shadow-md"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${domain.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                        domain.status === 'failed' ? 'bg-red-50 text-red-600' :
                                            'bg-amber-50 text-amber-600'
                                    }`}>
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{domain.domain}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {domain.status === 'active' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3" /> Active
                                            </span>
                                        ) : domain.status === 'failed' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                <AlertCircle className="w-3 h-3" /> Verification Failed
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Pending Verification
                                            </span>
                                        )}
                                        <span className="text-xs text-stone-400">
                                            Added {new Date(domain.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(domain.id)}
                                className="text-stone-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {domain.status !== 'active' && (
                            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-stone-400" />
                                    DNS Configuration
                                </h4>
                                <p className="text-sm text-stone-500 mb-4">
                                    Add the following DNS records to your domain provider to verify ownership.
                                </p>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">TYPE</div>
                                            <div className="font-mono text-sm text-slate-900">CNAME</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">NAME</div>
                                            <div className="font-mono text-sm text-slate-900 flex items-center justify-between group">
                                                <span>{domain.domain.split('.')[0]}</span>
                                                <button onClick={() => copyToClipboard(domain.domain.split('.')[0])} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy className="w-3 h-3 text-stone-400 hover:text-slate-900" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">VALUE</div>
                                            <div className="font-mono text-sm text-slate-900 flex items-center justify-between group">
                                                <span>cname.linkly.ai</span>
                                                <button onClick={() => copyToClipboard('cname.linkly.ai')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy className="w-3 h-3 text-stone-400 hover:text-slate-900" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">TYPE</div>
                                            <div className="font-mono text-sm text-slate-900">TXT</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">NAME</div>
                                            <div className="font-mono text-sm text-slate-900 flex items-center justify-between group">
                                                <span>@</span>
                                                <button onClick={() => copyToClipboard('@')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy className="w-3 h-3 text-stone-400 hover:text-slate-900" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-stone-200">
                                            <div className="text-xs text-stone-400 font-bold mb-1">VALUE</div>
                                            <div className="font-mono text-sm text-slate-900 flex items-center justify-between group">
                                                <span className="truncate max-w-[150px]">{domain.verificationToken}</span>
                                                <button onClick={() => copyToClipboard(domain.verificationToken)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Copy className="w-3 h-3 text-stone-400 hover:text-slate-900" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => handleVerify(domain.id)}
                                        disabled={verifyingId === domain.id}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {verifyingId === domain.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify DNS Records'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {!loading && domains.length === 0 && !isAdding && (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                        <Globe className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No custom domains yet</h3>
                        <p className="text-stone-500 mb-6">Connect a domain to start branding your links.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-yellow-600 hover:text-yellow-700 font-bold flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add your first domain
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DomainManager;
