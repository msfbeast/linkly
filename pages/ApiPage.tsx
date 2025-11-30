import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Plus, Trash2, Copy, Check, Terminal, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { ApiKey } from '../types';

const ApiPage: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
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
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Developer API</h1>
                    <p className="text-stone-500">Manage API keys and view documentation.</p>
                </div>
                <button
                    onClick={handleCreateKey}
                    disabled={creating || !!newKey}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
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
                    className="bg-green-50 border border-green-200 rounded-2xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Key className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-green-900 mb-1">API Key Generated</h3>
                            <p className="text-green-700 text-sm mb-4">
                                This is the only time your key will be shown. Please copy it and store it securely.
                            </p>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl p-3">
                                <code className="flex-1 font-mono text-sm text-slate-700 break-all">
                                    {newKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(newKey)}
                                    className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                                onClick={() => setNewKey(null)}
                                className="mt-4 text-sm font-bold text-green-700 hover:underline"
                            >
                                I have saved my key
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* API Keys List */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                    <h3 className="font-bold text-slate-900">Active API Keys</h3>
                </div>
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                    </div>
                ) : keys.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">
                        No API keys found. Generate one to get started.
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
                                            <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                                {key.prefix}
                                            </span>
                                            <span>• Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-2">
                                        {key.scopes.map(scope => (
                                            <span key={scope} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                                                {scope}
                                            </span>
                                        ))}
                                    </div>
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

            {/* Documentation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <Terminal className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-bold">Quick Start</h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm">
                            Authenticate requests by including your API key in the Authorization header.
                        </p>
                        <div className="bg-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                            <div className="text-slate-500 mb-2"># Example Request</div>
                            <div className="text-green-400">curl -X POST https://api.gather.link/v1/links \</div>
                            <div className="text-white pl-4">-H "Authorization: Bearer <span className="text-yellow-400">pk_live_...</span>" \</div>
                            <div className="text-white pl-4">-H "Content-Type: application/json" \</div>
                            <div className="text-white pl-4">-d '{"{"}"url": "https://google.com"{"}"}'</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-blue-500" />
                        <h3 className="text-lg font-bold text-slate-900">Security Best Practices</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600">
                        <li className="flex gap-3">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Keep your API keys secret. Never share them in public repositories or client-side code.</span>
                        </li>
                        <li className="flex gap-3">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Rotate your keys periodically to minimize risk if a key is compromised.</span>
                        </li>
                        <li className="flex gap-3">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Use different keys for development and production environments.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ApiPage;
