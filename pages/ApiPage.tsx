import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { ApiKey } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Label, MonoPill, Tile } from '../components/ui/bento';

/** /api/v1/links needs this scope to create links. */
export const LINK_WRITE_SCOPE = 'links:write';

/** Whether a key can create links; keys made before this page asked for the right scope can't. */
export const canCreateLinks = (key: ApiKey) => (key.scopes || []).includes(LINK_WRITE_SCOPE);

const ERRORS: [string, string][] = [
    ['400', 'Missing or invalid url, title (up to 255 characters) or tags (up to 20 strings)'],
    ['401', 'Missing, unknown or expired API key'],
    ['403', 'The key can\'t create links, or a free account is at its link limit'],
    ['429', 'More than 60 requests a minute from one key'],
];

const CopyButton: React.FC<{ text: string; label: string; dark?: boolean }> = ({ text, label, dark }) => {
    const [done, setDone] = useState(false);
    return (
        <button type="button" aria-label={label}
            onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); }}
            className={`shrink-0 rounded-full p-2 ${dark ? 'text-[#A19E97] hover:bg-[#2A2A2D] hover:text-white' : 'text-[#8C8981] hover:bg-[#E6E3DD] hover:text-[#18181A]'}`}>
            {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
    );
};

const ApiPage: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        supabaseAdapter.getApiKeys()
            .then(k => { if (!cancelled) { setKeys(k); setFailed(false); } })
            .catch(err => { console.error('[API] keys failed', err); if (!cancelled) setFailed(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user, authLoading]);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const label = name.trim() || `Key ${keys.length + 1}`;
            const { apiKey, secretKey } = await supabaseAdapter.createApiKey(label, [LINK_WRITE_SCOPE]);
            setKeys([apiKey, ...keys]);
            setNewKey(secretKey);
            setName('');
        } catch (err) {
            console.error('[API] create failed', err);
            toast.error('Could not create a key. Try again.');
        } finally {
            setCreating(false);
        }
    };

    const revoke = async (key: ApiKey) => {
        if (!window.confirm(`Revoke "${key.name}"? Anything using it stops working straight away.`)) return;
        try {
            await supabaseAdapter.revokeApiKey(key.id);
            setKeys(keys.filter(k => k.id !== key.id));
        } catch (err) {
            console.error('[API] revoke failed', err);
            toast.error('Could not revoke the key. Try again.');
        }
    };

    const origin = window.location.origin;
    const curl = `curl -X POST ${origin}/api/v1/links \\
  -H "Authorization: Bearer ga_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://www.amazon.in/dp/B0EXAMPLE", "title": "Earbuds deal", "tags": ["deals"] }'`;
    const response = `HTTP/1.1 201 Created
{
  "id": "7c0e…",
  "shortUrl": "${origin}/k3m9pqa",
  "originalUrl": "https://www.amazon.in/dp/B0EXAMPLE?tag=yourname-21",
  "createdAt": "2026-11-18T10:00:00.000Z"
}`;

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-5">
                    <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Developer API</h1>
                    <p className="mt-1 text-[13px] text-[#8C8981]">Create short links from your own scripts and apps.</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    {/* Keys */}
                    <Tile className="lg:col-span-12">
                        <Label>API keys</Label>
                        <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
                            <label htmlFor="key-name" className="sr-only">Key name</label>
                            <input id="key-name" value={name} onChange={e => setName(e.target.value)} maxLength={60}
                                placeholder="Name it after where it's used, e.g. Zapier"
                                className="flex-1 rounded-2xl bg-[#F0EEEA] px-4 py-3 text-[14px] outline-none placeholder:text-[#A19E97] focus:ring-2 focus:ring-[#FF5A14]/30" />
                            <button type="submit" disabled={creating || !!newKey}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18181A] px-5 py-3 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-40">
                                {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create key
                            </button>
                        </form>

                        {newKey && (
                            <div className="mt-4 rounded-2xl bg-[#18181A] p-4 text-[#F2F1EE]" role="status">
                                <p className="text-[13px] text-[#FF9B6A]">Copy this key now. It won't be shown again.</p>
                                <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#232326] py-1.5 pl-3 pr-1.5">
                                    <code className="min-w-0 flex-1 select-all break-all font-mono text-[13px]">{newKey}</code>
                                    <CopyButton text={newKey} label="Copy key" dark />
                                </div>
                                <button onClick={() => setNewKey(null)} className="mt-3 text-[13px] text-[#A19E97] underline underline-offset-2 hover:text-white">I've saved it</button>
                            </div>
                        )}

                        <div className="mt-4">
                            {loading ? (
                                <p className="flex items-center gap-2 text-[13px] text-[#8C8981]"><Loader2 className="h-4 w-4 animate-spin" /> Loading keys…</p>
                            ) : failed ? (
                                <p className="text-[13px] text-[#B42318]">Couldn't load your keys. Reload the page to try again.</p>
                            ) : keys.length === 0 ? (
                                <p className="text-[13px] text-[#8C8981]">No keys yet.</p>
                            ) : (
                                <ul className="grid gap-1.5">
                                    {keys.map(k => (
                                        <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[#F3F2EF] px-4 py-3">
                                            <span className="text-[14px]">{k.name}</span>
                                            <span className="font-mono text-[12px] text-[#8C8981]">{k.prefix}</span>
                                            {!canCreateLinks(k) && (
                                                <span className="rounded-md bg-[#FFE3D5] px-2 py-0.5 font-mono text-[11px] text-[#C2410C]" title="Made before keys could create links. Create a new key and revoke this one.">
                                                    can't create links
                                                </span>
                                            )}
                                            <span className="ml-auto font-mono text-[11px] text-[#A19E97]">
                                                {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'never used'}
                                                {' · '}made {new Date(k.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <button onClick={() => revoke(k)} aria-label={`Revoke ${k.name}`} className="rounded-full p-1.5 text-[#8C8981] hover:bg-[#E6E3DD] hover:text-[#B42318]">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <p className="mt-4 text-[12px] text-[#A19E97]">Keep keys on a server. Anyone with a key can create links in your account.</p>
                    </Tile>

                    {/* Docs */}
                    <Tile dark className="lg:col-span-7">
                        <Label dark right={<MonoPill dark>POST /api/v1/links</MonoPill>}>Create a short link</Label>
                        <div className="relative">
                            <pre className="overflow-x-auto rounded-2xl bg-[#232326] p-4 pr-12 font-mono text-[12px] leading-relaxed text-[#E8E6E1]">{curl}</pre>
                            <div className="absolute right-2 top-2"><CopyButton text={curl} label="Copy example request" dark /></div>
                        </div>
                        <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#232326] p-4 font-mono text-[12px] leading-relaxed text-[#A19E97]">{response}</pre>
                        <p className="mt-3 text-[12px] text-[#8E8B84]">Amazon and Flipkart links get your affiliate tags, as in the app. Free accounts count API links toward their limit.</p>
                    </Tile>

                    <Tile className="lg:col-span-5">
                        <Label>Body</Label>
                        <dl className="grid gap-3 text-[13px]">
                            {[
                                ['url', 'required', 'The http or https address to shorten, up to 2,048 characters.'],
                                ['title', 'optional', 'Shown in your dashboard, up to 255 characters. Defaults to one made from the address.'],
                                ['tags', 'optional', 'Up to 20 strings, each up to 50 characters.'],
                            ].map(([field, need, text]) => (
                                <div key={field}>
                                    <dt className="flex items-center gap-2"><code className="font-mono">{field}</code><span className="text-[11px] text-[#A19E97]">{need}</span></dt>
                                    <dd className="mt-0.5 text-[#5F5C56]">{text}</dd>
                                </div>
                            ))}
                        </dl>
                        <h3 className="mb-2 mt-6 text-[12px] text-[#8C8981]">Errors</h3>
                        <dl className="grid gap-2 text-[13px]">
                            {ERRORS.map(([code, text]) => (
                                <div key={code} className="grid grid-cols-[40px_1fr] gap-2">
                                    <dt className="font-mono">{code}</dt>
                                    <dd className="text-[#5F5C56]">{text}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-3 text-[12px] text-[#A19E97]">Errors come back as <code className="font-mono">{'{ "error": "…" }'}</code>.</p>
                    </Tile>
                </div>
            </div>
        </div>
    );
};

export default ApiPage;
