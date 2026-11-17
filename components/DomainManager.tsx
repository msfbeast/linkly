import React, { useState, useEffect } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { Domain } from '../types';
import { Trash2, CheckCircle, RefreshCw, ExternalLink, Plus } from 'lucide-react';
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
            toast.error('Enter a domain like links.yourdomain.com');
            return;
        }

        setAdding(true);
        try {
            const added = await supabaseAdapter.addDomain(userId, domain);
            setDomains([...domains, added]);
            setNewDomain('');
            toast.success('Domain added. Now add the DNS records below.');
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

    const recordName = (domain: string, prefix = '') => {
        const sub = domain.split('.').length > 2 ? domain.split('.')[0] : '';
        return prefix ? (sub ? `${prefix}.${sub}` : prefix) : (sub || '@');
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-2 text-[13px] text-[#8C8981]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[#FF5A14]" />
                <span>Custom domains</span>
            </div>
            <p className="mb-4 text-[13px] text-[#8C8981]">Use your own domain, like links.yourname.com, for your short links and bio page.</p>

            <form onSubmit={handleAddDomain} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="domain-input" className="sr-only">Domain</label>
                <input
                    id="domain-input"
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="links.yourdomain.com"
                    className="flex-1 rounded-2xl bg-[#F0EEEA] px-4 py-3 font-mono text-[13px] outline-none ring-[#FF5A14]/40 placeholder:text-[#A19E97] focus:ring-2"
                />
                <button
                    type="submit"
                    disabled={adding || !newDomain}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18181A] px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-40"
                >
                    {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Connect
                </button>
            </form>

            <div className="mt-4 grid gap-2">
                {loading ? (
                    <p className="py-4 text-[13px] text-[#8C8981]">Loading domains…</p>
                ) : domains.length === 0 ? (
                    <p className="py-2 text-[13px] text-[#A19E97]">No domains connected yet.</p>
                ) : (
                    domains.map(domain => {
                        const active = domain.status === 'active';
                        const failed = domain.status === 'failed';
                        return (
                            <div key={domain.id} className="rounded-2xl bg-[#F3F2EF] p-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-mono text-[14px]">{domain.domain}</span>
                                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${active ? 'bg-[#18181A] text-white' : failed ? 'bg-[#FDECEA] text-[#B42318]' : 'bg-[#FFE3D5] text-[#C2410C]'}`}>
                                        {active ? 'live' : failed ? 'check failed' : 'waiting for DNS'}
                                    </span>
                                    <span className="ml-auto flex items-center gap-1">
                                        {!active && (
                                            <button
                                                onClick={() => handleVerify(domain.id)}
                                                disabled={verifying === domain.id}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-[#FBFAF8] px-3 py-1.5 text-[12px] hover:bg-white disabled:opacity-50"
                                            >
                                                {verifying === domain.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                                Check DNS
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(domain.id)}
                                            aria-label={`Remove ${domain.domain}`}
                                            className="rounded-full p-2 text-[#8C8981] hover:bg-[#FBFAF8] hover:text-[#B42318]"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </span>
                                </div>

                                {!active && (
                                    <div className="mt-4">
                                        <p className="mb-2 text-[12px] text-[#8C8981]">
                                            At your domain provider (GoDaddy, Namecheap, Cloudflare…), add these two records, then press Check DNS.{' '}
                                            <a href="https://support.google.com/a/answer/47283" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-[#18181A]">
                                                How <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </p>
                                        <div className="overflow-x-auto rounded-xl bg-[#18181A] p-3 font-mono text-[12px] text-[#F2F1EE]">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-[11px] text-[#77746D]">
                                                        <th className="pb-1.5 pr-4 font-normal">Type</th>
                                                        <th className="pb-1.5 pr-4 font-normal">Name</th>
                                                        <th className="pb-1.5 font-normal">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="py-1 pr-4">CNAME</td>
                                                        <td className="select-all py-1 pr-4">{recordName(domain.domain)}</td>
                                                        <td className="select-all py-1 text-[#FF9B6A]">custom.gather.link</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1 pr-4">TXT</td>
                                                        <td className="select-all py-1 pr-4">{recordName(domain.domain, '_gather')}</td>
                                                        <td className="select-all break-all py-1 text-[#FF9B6A]">gather-verification={domain.verificationToken}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DomainManager;
