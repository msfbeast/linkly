import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Terminal, Shield, Book, Code, Globe, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { ApiKey } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ApiPage: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true); // Internal loading for keys
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            loadKeys();
        } else {
            setLoading(false);
            setKeys([]);
        }
    }, [user, authLoading]);

    const loadKeys = async () => {
        setLoading(true);
        try {
            const apiKeys = await supabaseAdapter.getApiKeys();
            setKeys(apiKeys);
        } catch (error) {
            console.error('Failed to load API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        setCreating(true);
        try {
            const { apiKey, secretKey } = await supabaseAdapter.createApiKey(`Key ${keys.length + 1}`);
            setKeys([apiKey, ...keys]);
            setNewKey(secretKey);
        } catch (error) {
            console.error('Failed to create API key:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) return;
        try {
            await supabaseAdapter.revokeApiKey(id);
            setKeys(keys.filter(k => k.id !== id));
        } catch (error) {
            console.error('Failed to revoke key:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Developer API</h1>
                    <p className="text-stone-500 text-lg">Integrate Gather's powerful link shortening directly into your apps.</p>
                </div>

                <div className="flex p-1 bg-stone-100 rounded-xl space-x-1">
                    <button
                        onClick={() => setActiveTab('keys')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'keys'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-stone-500 hover:text-slate-900'
                            }`}
                    >
                        API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'docs'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-stone-500 hover:text-slate-900'
                            }`}
                    >
                        Documentation
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'keys' ? (
                    <motion.div
                        key="keys"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-200">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Manage Keys</h2>
                                <p className="text-stone-500 text-sm">Create and revoke access keys for your applications.</p>
                            </div>
                            <button
                                onClick={handleCreateKey}
                                disabled={creating || !!newKey}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/20"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                <span>Generate New Key</span>
                            </button>
                        </div>

                        {/* New Key Display */}
                        {newKey && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Key className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-emerald-900 mb-1">API Key Generated</h3>
                                        <p className="text-emerald-700 text-sm mb-4">
                                            This is the only time your key will be shown. Please copy it and store it securely.
                                        </p>
                                        <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl p-3">
                                            <code className="flex-1 font-mono text-sm text-slate-700 break-all select-all">
                                                {newKey}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(newKey)}
                                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                                            >
                                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setNewKey(null)}
                                            className="mt-4 text-sm font-bold text-emerald-700 hover:underline"
                                        >
                                            I have saved my key
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* API Keys List */}
                        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Active Credentials</h3>
                            </div>
                            {loading ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                                </div>
                            ) : keys.length === 0 ? (
                                <div className="p-12 text-center text-stone-500">
                                    <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No API keys found. Generate one to get started.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {keys.map((key) => (
                                        <div key={key.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                                                    <Terminal className="w-5 h-5 text-stone-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{key.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mt-1">
                                                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 border border-stone-200">
                                                            {key.prefix}...
                                                        </span>
                                                        <span>• Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {!key.lastUsedAt && (
                                                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">Never used</span>
                                                )}
                                                {key.lastUsedAt && (
                                                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                        Active {new Date(key.lastUsedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <div className="w-px h-6 bg-stone-200"></div>
                                                <button
                                                    onClick={() => handleRevokeKey(key.id)}
                                                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Revoke Key"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-blue-900">Security Best Practices</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-blue-800 ml-8 list-disc">
                                <li>Keep your API keys secret. Never share them in public repositories.</li>
                                <li>Do not expose keys in client-side code (browsers). Use a backend proxy.</li>
                                <li>Rotate your keys periodically to minimize risk if a key is compromised.</li>
                                <li>Use different keys for development and production environments.</li>
                            </ul>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="docs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Intro */}
                        <div className="prose max-w-none">
                            <p className="text-stone-600">
                                The Linkly API allows you to programmatically create shortened links, track analytics (coming soon), and manage your resources.
                                All API requests must be authenticated using a Bearer Token.
                            </p>
                        </div>

                        {/* Endpoints */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold font-mono">POST</span>
                                        <code className="text-slate-900 font-mono text-lg">/api/v1/links</code>
                                    </div>
                                    <h3 className="mt-4 font-bold text-slate-900">Create a short link</h3>
                                    <p className="text-stone-500 text-sm mt-1">Generates a new short URL for the provided original URL.</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Request Body</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-stone-500 border-b border-stone-100">
                                                    <tr>
                                                        <th className="pb-2 font-medium">Parameter</th>
                                                        <th className="pb-2 font-medium">Type</th>
                                                        <th className="pb-2 font-medium">Required</th>
                                                        <th className="pb-2 font-medium">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-slate-700">
                                                    <tr className="border-b border-stone-50">
                                                        <td className="py-3 font-mono text-indigo-600">url</td>
                                                        <td className="py-3 font-mono text-stone-500">string</td>
                                                        <td className="py-3"><span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full">Yes</span></td>
                                                        <td className="py-3">The destination URL you want to shorten.</td>
                                                    </tr>
                                                    <tr className="border-b border-stone-50">
                                                        <td className="py-3 font-mono text-indigo-600">title</td>
                                                        <td className="py-3 font-mono text-stone-500">string</td>
                                                        <td className="py-3"><span className="text-stone-400 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-full">Optional</span></td>
                                                        <td className="py-3">A custom title for the link (for dashboard).</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 font-mono text-indigo-600">tags</td>
                                                        <td className="py-3 font-mono text-stone-500">array</td>
                                                        <td className="py-3"><span className="text-stone-400 font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-full">Optional</span></td>
                                                        <td className="py-3">List of tags to organize the link.</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Example Request</h4>
                                        <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-slate-300 overflow-x-auto">
                                            <div className="flex gap-4 mb-4 border-b border-slate-800 pb-2">
                                                <div className="text-white font-bold border-b-2 border-yellow-400 pb-2 -mb-2.5">cURL</div>
                                                <div className="text-slate-500">Node.js</div>
                                                <div className="text-slate-500">Python</div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-purple-400">curl</span> <span className="text-yellow-300">-X POST</span> {window.location.origin}/api/v1/links \<br />
                                                &nbsp;&nbsp;<span className="text-yellow-300">-H</span> <span className="text-green-300">"Authorization: Bearer pk_live_..."</span> \<br />
                                                &nbsp;&nbsp;<span className="text-yellow-300">-H</span> <span className="text-green-300">"Content-Type: application/json"</span> \<br />
                                                &nbsp;&nbsp;<span className="text-yellow-300">-d</span> <span className="text-green-300">{`'{ "url": "https://example.com/my-long-url", "tags": ["campaign"] }'`}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Example Response</h4>
                                        <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm border border-stone-200 overflow-x-auto text-slate-700">
                                            <pre>{`{
  "id": "link_123456789",
  "shortUrl": "${window.location.origin}/abc123",
  "originalUrl": "https://example.com/my-long-url",
  "createdAt": "2024-03-20T10:00:00Z"
}`}</pre>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Error Codes</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                                <div className="font-bold text-red-700 font-mono text-sm">400 Bad Request</div>
                                                <div className="text-red-600 text-xs mt-1">Missing required fields (e.g. url)</div>
                                            </div>
                                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                <div className="font-bold text-amber-700 font-mono text-sm">401 Unauthorized</div>
                                                <div className="text-amber-600 text-xs mt-1">Invalid or missing API key</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApiPage;
