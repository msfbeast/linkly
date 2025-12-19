import React, { useState, useEffect } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Domain } from '../types';
import { Trash2, AlertCircle, CheckCircle, Globe, RefreshCw, Copy, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface DomainManagerProps {
    userId: string;
}

const DomainManager: React.FC<DomainManagerProps> = ({ userId }) => {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDomain, setNewDomain] = useState('');
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        fetchDomains();
    }, [userId]);

    const fetchDomains = async () => {
        try {
            const data = await supabaseAdapter.getDomains(userId);
            setDomains(data);
        } catch (error) {
            console.error('Failed to fetch domains', error);
            toast.error('Failed to load domains');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain) return;

        // Basic validation
        // Remove protocol
        let domain = newDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        if (!domain.includes('.')) {
            toast.error('Please enter a valid domain (e.g., bio.john.com)');
            return;
        }

        setAdding(true);
        try {
            const added = await supabaseAdapter.addDomain(userId, domain);
            setDomains([...domains, added]);
            setNewDomain('');
            toast.success('Domain added! configure DNS now.');
        } catch (error: any) {
            console.error('Add domain failed', error);
            toast.error(error.message || 'Failed to add domain');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this domain?')) return;
        try {
            await supabaseAdapter.deleteDomain(id);
            setDomains(domains.filter(d => d.id !== id));
            toast.success('Domain removed');
        } catch (error) {
            toast.error('Failed to remove domain');
        }
    };

    const handleVerify = async (id: string) => {
        setVerifying(id);
        try {
            const verified = await supabaseAdapter.verifyDomain(id);
            setDomains(domains.map(d => d.id === id ? verified : d));
            toast.success('Domain verified successfully!');
        } catch (error: any) {
            console.error('Verification failed', error);
            toast.error(error.message || 'Verification failed. Check your DNS records.');
        } finally {
            setVerifying(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Custom Domains</h2>
                <p className="text-stone-500 text-sm">Connect your own domain to your Bio Page.</p>
            </div>

            {/* Add Domain Form */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
                <form onSubmit={handleAddDomain} className="flex gap-3">
                    <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="e.g. bio.yourdomain.com"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !newDomain}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Connect
                    </button>
                </form>
                <p className="text-xs text-stone-500 mt-3 ml-1">
                    Replaces standard gather.link URLs with your own brand.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Step 1: Add CNAME Record</h3>
                    <p className="text-slate-200 text-sm mb-4">
                        In your DNS provider, create a CNAME record for your subdomain (e.g., <span className="text-emerald-400 font-bold">links</span>.yourdomain.com) pointing to:
                    </p>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                        <span className="text-emerald-400 font-bold select-all">custom.gather.link</span>
                    </div>
                </div>
            </div>

            {/* Domain List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-stone-400">Loading domains...</div>
                ) : domains.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-stone-100 rounded-xl">
                        <Globe className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                        <p className="text-stone-500">No domains connected yet.</p>
                    </div>
                ) : (
                    domains.map(domain => (
                        <div key={domain.id} className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${domain.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                        domain.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {domain.status === 'active' ? <CheckCircle className="w-5 h-5" /> :
                                            domain.status === 'failed' ? <AlertCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{domain.domain}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${domain.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {domain.status}
                                            </span>
                                            <span className="text-xs text-stone-400 flex items-center gap-1">
                                                <Copy className="w-3 h-3" /> {domain.status === 'active' ? 'Live' : 'DNS Setup Required'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {domain.status !== 'active' && (
                                        <button
                                            onClick={() => handleVerify(domain.id)}
                                            disabled={verifying === domain.id}
                                            className="px-4 py-2 bg-white border border-stone-200 text-slate-700 font-medium rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            {verifying === domain.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                            Verify DNS
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(domain.id)}
                                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {domain.status !== 'active' && (
                                <div className="mt-6 p-4 bg-slate-900 rounded-lg text-slate-300 font-mono text-sm overflow-x-auto">
                                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4">
                                        <span className="text-slate-400 text-xs uppercase tracking-wider">DNS Configuration</span>
                                        <a href="https://support.google.com/a/answer/47283" target="_blank" rel="noreferrer" className="text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1">
                                            Help <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>

                                    <div className="mb-4 text-xs text-slate-200 space-y-1">
                                        <p>1. Log in to your domain provider (e.g., GoDaddy, Namecheap).</p>
                                        <p>2. Navigate to <strong>DNS Settings</strong> or <strong>DNS Management</strong>.</p>
                                        <p>3. Add a new record with the following values:</p>
                                    </div>

                                    <div className="grid grid-cols-[80px_1fr] gap-4 mb-2 bg-slate-800/50 p-2 rounded">
                                        <span className="text-slate-500">Type</span>
                                        <span className="font-bold text-white">CNAME</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-4 mb-2">
                                        <span className="text-slate-500">Name</span>
                                        <span className="text-white">
                                            {domain.domain.split('.').length > 2 ? domain.domain.split('.')[0] : '@'}
                                            <span className="text-slate-600 italic ml-2">(subdomain)</span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-4">
                                        <span className="text-slate-500">Value</span>
                                        <span className="text-emerald-400 font-bold select-all">custom.gather.link</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DomainManager;
