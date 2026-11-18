import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Check, ExternalLink, GripVertical, Loader2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
    DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { BioProfile, BioTheme, LinkData } from '../types';
import { Label, Tile } from '../components/ui/bento';
import { storeLook, StoreLook } from '../utils/storePage';
import { STORE_LOOKS } from '../utils/storeLooks';

const MAX_BIO = 300;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const inputClass = 'w-full rounded-2xl bg-[#F0EEEA] px-4 py-3 text-[14px] text-[#18181A] outline-none placeholder:text-[#A19E97] focus:ring-2 focus:ring-[#FF5A14]/30';

/** Handles become /@handle: lowercase letters, numbers, dots, dashes and underscores. */
export const cleanHandle = (v: string) => v.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '').slice(0, 30);

interface Draft {
    displayName: string;
    handle: string;
    bio: string;
    avatarUrl: string;
    look: StoreLook;
    links: string[];
}

const draftOf = (p: BioProfile): Draft => ({
    displayName: p.displayName || '',
    handle: p.handle,
    bio: p.bio || '',
    avatarUrl: p.avatarUrl || '',
    look: storeLook(p.theme),
    links: p.links || [],
});

/** Which saved fields a draft changes; empty when there's nothing to save. */
export function draftChanges(saved: Draft, draft: Draft): Partial<BioProfile> {
    const out: Partial<BioProfile> = {};
    if (draft.displayName.trim() !== saved.displayName) out.displayName = draft.displayName.trim();
    if (draft.handle !== saved.handle) out.handle = draft.handle;
    if (draft.bio.trim() !== saved.bio) out.bio = draft.bio.trim();
    if (draft.avatarUrl !== saved.avatarUrl) out.avatarUrl = draft.avatarUrl;
    if (draft.look !== saved.look) out.theme = draft.look as BioTheme;
    if (draft.links.join(',') !== saved.links.join(',')) out.links = draft.links;
    return out;
}

const SortableRow: React.FC<{ link: LinkData; onRemove: () => void }> = ({ link, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
    return (
        <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 rounded-2xl bg-[#F3F2EF] py-2 pl-1.5 pr-2 ${isDragging ? 'z-10 shadow-lg' : ''}`}>
            <button type="button" {...attributes} {...listeners} aria-label={`Move ${link.title || link.shortCode}`}
                className="cursor-grab rounded-lg p-1.5 text-[#A19E97] hover:text-[#18181A] active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]">{link.title || `/${link.shortCode}`}</div>
                <div className="truncate font-mono text-[11px] text-[#A19E97]">/{link.shortCode}</div>
            </div>
            <button type="button" onClick={onRemove} aria-label={`Remove ${link.title || link.shortCode} from the page`}
                className="rounded-full p-1.5 text-[#8C8981] hover:bg-[#E6E3DD] hover:text-[#18181A]">
                <X className="h-4 w-4" />
            </button>
        </li>
    );
};

/** What visitors see, drawn from the draft: same look classes as the store page. */
const Preview: React.FC<{ draft: Draft; links: LinkData[] }> = ({ draft, links }) => {
    const look = STORE_LOOKS[draft.look];
    const name = draft.displayName.trim() || `@${draft.handle}`;
    return (
        <div className={`overflow-hidden rounded-[28px] p-3 ${look.page}`} aria-label="Preview">
            <div className={`flex flex-col items-center rounded-3xl px-4 py-6 text-center ${look.tile}`}>
                <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-semibold ${look.soft}`}>
                    {draft.avatarUrl ? <img src={draft.avatarUrl} alt="" className="h-full w-full object-cover" /> : name.replace(/^@/, '').charAt(0).toUpperCase()}
                </div>
                <div className="mt-3 text-[18px] font-semibold leading-tight">{name}</div>
                {draft.displayName.trim() && <div className={`mt-0.5 font-mono text-[11px] ${look.muted}`}>@{draft.handle}</div>}
                {draft.bio.trim() && <p className={`mt-2 whitespace-pre-line text-[12px] leading-relaxed ${look.muted}`}>{draft.bio.trim()}</p>}
            </div>
            <div className="mt-2.5 grid gap-2">
                {links.length === 0 && <p className={`py-6 text-center text-[12px] ${look.muted}`}>No links on the page yet.</p>}
                {links.slice(0, 8).map(l => (
                    <div key={l.id} className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-[13px] font-medium ${look.card}`}>
                        <span className="truncate">{l.title || `/${l.shortCode}`}</span>
                        <ArrowUpRight className={`h-4 w-4 shrink-0 ${look.muted}`} />
                    </div>
                ))}
                {links.length > 8 && <p className={`text-center text-[11px] ${look.muted}`}>and {links.length - 8} more</p>}
            </div>
        </div>
    );
};

const BioDashboard: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<BioProfile | null>(null);
    const [allLinks, setAllLinks] = useState<LinkData[]>([]);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [handleState, setHandleState] = useState<'same' | 'checking' | 'free' | 'taken' | 'short'>('same');
    const [picking, setPicking] = useState(false);
    const [query, setQuery] = useState('');
    const latestCheck = useRef(0);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        setState('loading');
        Promise.all([supabaseAdapter.getBioProfiles(user.id), supabaseAdapter.getLinks(null, { includeAnalytics: false })])
            .then(([profiles, links]) => {
                if (cancelled) return;
                setAllLinks(links);
                const p = profiles[0] ?? null;
                setProfile(p);
                setDraft(p ? draftOf(p) : { displayName: user.displayName || '', handle: '', bio: '', avatarUrl: '', look: 'light', links: [] });
                setHandleState(p ? 'same' : 'short');
                setState(p ? 'ready' : 'none');
            })
            .catch(err => { console.error('[Bio] load failed', err); if (!cancelled) setState('error'); });
        return () => { cancelled = true; };
    }, [user?.id, attempt]);

    const byId = useMemo(() => new Map(allLinks.map(l => [l.id, l])), [allLinks]);
    const pageLinks = useMemo(() => (draft?.links ?? []).map(id => byId.get(id)).filter((l): l is LinkData => !!l), [draft?.links, byId]);
    const saved = profile ? draftOf(profile) : null;
    const changes = saved && draft ? draftChanges(saved, draft) : {};
    const dirty = Object.keys(changes).length > 0;

    const set = (patch: Partial<Draft>) => setDraft(d => (d ? { ...d, ...patch } : d));

    const onHandle = async (raw: string) => {
        const h = cleanHandle(raw);
        set({ handle: h });
        const n = ++latestCheck.current;
        if (profile && h === profile.handle) { setHandleState('same'); return; }
        if (h.length < 3) { setHandleState('short'); return; }
        setHandleState('checking');
        try {
            const free = await supabaseAdapter.checkHandleAvailability(h);
            if (n === latestCheck.current) setHandleState(free ? 'free' : 'taken');
        } catch {
            if (n === latestCheck.current) setHandleState('same');
        }
    };

    const uploadAvatar = async (file: File | undefined) => {
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) { toast.error('Choose an image file'); return; }
        if (file.size > MAX_AVATAR_BYTES) { toast.error('The photo must be under 5 MB'); return; }
        setUploading(true);
        try {
            const url = await supabaseAdapter.uploadAvatar(user.id, file);
            set({ avatarUrl: url });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not upload the photo');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (!profile || !draft || !dirty) return;
        if (handleState === 'taken' || handleState === 'short' || handleState === 'checking') return;
        setSaving(true);
        try {
            const updated = await supabaseAdapter.updateBioProfile(profile.id, changes);
            const next = updated ?? { ...profile, ...changes };
            setProfile(next);
            setDraft(draftOf(next));
            setHandleState('same');
            toast.success('Saved');
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            toast.error(/duplicate key|unique/i.test(msg) ? 'That handle is taken. Choose another.' : 'Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const create = async () => {
        if (!user || !draft) return;
        if (handleState !== 'free') return;
        setSaving(true);
        try {
            const created = await supabaseAdapter.createBioProfile(user.id, draft.handle, draft.displayName.trim() || draft.handle);
            const withRest = await supabaseAdapter.updateBioProfile(created.id, { bio: draft.bio.trim(), theme: draft.look as BioTheme, links: draft.links, isPublished: true });
            const p = withRest ?? created;
            setProfile(p);
            setDraft(draftOf(p));
            setHandleState('same');
            setState('ready');
            toast.success('Your page is live');
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            toast.error(/duplicate key|unique/i.test(msg) ? 'That handle is taken. Choose another.' : 'Could not create the page. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!draft || !over || active.id === over.id) return;
        const from = draft.links.indexOf(String(active.id));
        const to = draft.links.indexOf(String(over.id));
        if (from >= 0 && to >= 0) set({ links: arrayMove(draft.links, from, to) });
    };

    if (state === 'loading') {
        return <div className="min-h-screen bg-[#ECEBE7] p-8"><div className="mx-auto h-64 max-w-6xl animate-pulse rounded-3xl bg-[#FBFAF8]" aria-busy="true" aria-label="Loading" /></div>;
    }
    if (state === 'error') {
        return (
            <div className="min-h-screen bg-[#ECEBE7] p-4 sm:p-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl bg-[#FBFAF8] px-5 py-3 text-sm text-[#B42318]">
                    <span>Couldn't load your bio page.</span>
                    <button onClick={() => setAttempt(n => n + 1)} className="font-semibold underline underline-offset-2">Try again</button>
                </div>
            </div>
        );
    }

    // No page yet: pick a handle first.
    if (state === 'none' || !draft) {
        const d = draft ?? { displayName: '', handle: '', bio: '', avatarUrl: '', look: 'light' as StoreLook, links: [] };
        return (
            <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
                <div className="mx-auto max-w-xl">
                    <h1 className="mb-5 text-[28px] font-medium tracking-tight sm:text-[32px]">Bio page</h1>
                    <Tile>
                        <Label>Pick your address</Label>
                        <p className="mb-4 text-[13px] text-[#8C8981]">Your links and products show on one page at this address.</p>
                        <div className="flex items-center rounded-2xl bg-[#F0EEEA] px-4 focus-within:ring-2 focus-within:ring-[#FF5A14]/30">
                            <span className="select-none font-mono text-[14px] text-[#8C8981]">{window.location.host}/@</span>
                            <label htmlFor="new-handle" className="sr-only">Handle</label>
                            <input id="new-handle" value={d.handle} onChange={e => onHandle(e.target.value)} placeholder="yourname" autoCapitalize="off" spellCheck={false}
                                className="min-w-0 flex-1 bg-transparent py-3 font-mono text-[14px] outline-none placeholder:text-[#A19E97]" />
                        </div>
                        <p className={`mt-1.5 text-[12px] ${handleState === 'taken' ? 'text-[#B42318]' : 'text-[#A19E97]'}`}>
                            {handleState === 'taken' ? 'That handle is taken.' : handleState === 'short' ? 'At least 3 characters.' : handleState === 'free' ? 'Available.' : 'Letters, numbers, dots, dashes and underscores.'}
                        </p>
                        <button onClick={create} disabled={saving || handleState !== 'free'}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF5A14] px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-40">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create my page
                        </button>
                    </Tile>
                </div>
            </div>
        );
    }

    const pageUrl = `/@${profile!.handle}`;
    const q = query.trim().toLowerCase();
    const candidates = allLinks
        .filter(l => !draft.links.includes(l.id) && !l.isArchived)
        .filter(l => !q || (l.title || '').toLowerCase().includes(q) || l.shortCode.toLowerCase().includes(q))
        .slice(0, 30);
    const handleNote = handleState === 'taken' ? 'That handle is taken.' : handleState === 'short' ? 'At least 3 characters.'
        : handleState === 'checking' ? 'Checking…' : handleState === 'free' ? 'Available. Your old address stops working when you save.' : null;

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 pb-28 text-[#18181A] sm:p-8 sm:pb-28">
            <div className="mx-auto max-w-6xl">
                <div className="mb-5 flex flex-wrap items-end gap-3">
                    <div>
                        <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Bio page</h1>
                        <p className="mt-1 text-[13px] text-[#8C8981]">
                            {(profile!.views ?? 0).toLocaleString('en-IN')} views · products come from the Products tab
                        </p>
                    </div>
                    <a href={pageUrl} target="_blank" rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#FBFAF8] px-4 py-2 font-mono text-[12px] hover:bg-white">
                        {window.location.host}{pageUrl} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    <div className="grid content-start gap-3.5 lg:col-span-7">
                        {/* Profile */}
                        <Tile>
                            <Label>Profile</Label>
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <label className="relative h-20 w-20 shrink-0 cursor-pointer" aria-label="Change photo">
                                    <span className="block h-20 w-20 overflow-hidden rounded-full bg-[#18181A]">
                                        {draft.avatarUrl
                                            ? <img src={draft.avatarUrl} alt="" className="h-full w-full object-cover" />
                                            : <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-white">{(draft.displayName || draft.handle).charAt(0).toUpperCase()}</span>}
                                    </span>
                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5A14] text-white ring-4 ring-[#FBFAF8]">
                                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                    </span>
                                    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => uploadAvatar(e.target.files?.[0])} />
                                </label>
                                <div className="grid flex-1 gap-4">
                                    <div>
                                        <label htmlFor="bio-name" className="mb-1.5 block text-[12px] text-[#8C8981]">Name</label>
                                        <input id="bio-name" className={inputClass} value={draft.displayName} maxLength={60} onChange={e => set({ displayName: e.target.value })} placeholder="Your name or brand" />
                                    </div>
                                    <div>
                                        <label htmlFor="bio-handle" className="mb-1.5 block text-[12px] text-[#8C8981]">Handle</label>
                                        <div className={`flex items-center rounded-2xl bg-[#F0EEEA] px-4 focus-within:ring-2 ${handleState === 'taken' ? 'ring-2 ring-[#B42318]/40' : 'focus-within:ring-[#FF5A14]/30'}`}>
                                            <span className="select-none font-mono text-[14px] text-[#8C8981]">@</span>
                                            <input id="bio-handle" value={draft.handle} onChange={e => onHandle(e.target.value)} autoCapitalize="off" spellCheck={false}
                                                className="min-w-0 flex-1 bg-transparent py-3 pl-0.5 font-mono text-[14px] outline-none" />
                                            {handleState === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[#A19E97]" />}
                                            {handleState === 'free' && <Check className="h-4 w-4 text-[#FF5A14]" />}
                                        </div>
                                        {handleNote && <p className={`mt-1.5 text-[12px] ${handleState === 'taken' ? 'text-[#B42318]' : 'text-[#A19E97]'}`}>{handleNote}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="bio-text" className="mb-1.5 flex justify-between text-[12px] text-[#8C8981]">
                                            <span>Bio</span><span className="font-mono">{draft.bio.length}/{MAX_BIO}</span>
                                        </label>
                                        <textarea id="bio-text" rows={3} maxLength={MAX_BIO} className={`${inputClass} resize-none`} value={draft.bio}
                                            onChange={e => set({ bio: e.target.value })} placeholder="What people find here, in a line or two." />
                                    </div>
                                </div>
                            </div>
                        </Tile>

                        {/* Look */}
                        <Tile>
                            <Label>Look</Label>
                            <div role="group" aria-label="Page look" className="grid grid-cols-2 gap-2">
                                {(['light', 'dark'] as const).map(l => (
                                    <button key={l} type="button" onClick={() => set({ look: l })} aria-pressed={draft.look === l}
                                        className={`flex items-center gap-3 rounded-2xl p-3 text-left text-[13px] capitalize ring-2 transition-colors ${draft.look === l ? 'ring-[#18181A]' : 'ring-transparent hover:bg-[#F3F2EF]'}`}>
                                        <span className={`h-10 w-10 rounded-xl ${l === 'light' ? 'bg-[#ECEBE7] ring-1 ring-inset ring-[#DAD7D0]' : 'bg-[#111113]'}`} />
                                        {l}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-[12px] text-[#A19E97]">The same look applies to your products on the page.</p>
                        </Tile>

                        {/* Links */}
                        <Tile>
                            <Label right={<button type="button" onClick={() => setPicking(p => !p)} aria-expanded={picking}
                                className="inline-flex items-center gap-1 rounded-full bg-[#18181A] px-3 py-1.5 text-[12px] text-white hover:opacity-90"><Plus className="h-3.5 w-3.5" /> Add links</button>}>
                                Links on the page
                            </Label>
                            {picking && (
                                <div className="mb-4 rounded-2xl bg-[#F3F2EF] p-3">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A19E97]" />
                                        <label htmlFor="link-search" className="sr-only">Find a link</label>
                                        <input id="link-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find one of your links" autoFocus
                                            className="w-full rounded-xl bg-[#FBFAF8] py-2.5 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#FF5A14]/30" />
                                    </div>
                                    <ul className="mt-2 max-h-64 overflow-y-auto">
                                        {candidates.length === 0 && <li className="px-2 py-3 text-[12px] text-[#A19E97]">{allLinks.length ? 'No other links match.' : 'Create a link first, from New link.'}</li>}
                                        {candidates.map(l => (
                                            <li key={l.id}>
                                                <button type="button" onClick={() => set({ links: [...draft.links, l.id] })}
                                                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#FBFAF8]">
                                                    <Plus className="h-4 w-4 shrink-0 text-[#FF5A14]" />
                                                    <span className="min-w-0 flex-1 truncate text-[13px]">{l.title || `/${l.shortCode}`}</span>
                                                    <span className="font-mono text-[11px] text-[#A19E97]">/{l.shortCode}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {pageLinks.length === 0 ? (
                                <p className="text-[13px] text-[#8C8981]">No links yet. Add the ones you want visitors to see; drag to change the order.</p>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                    <SortableContext items={pageLinks.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        <ul className="grid gap-1.5">
                                            {pageLinks.map(l => (
                                                <SortableRow key={l.id} link={l} onRemove={() => set({ links: draft.links.filter(id => id !== l.id) })} />
                                            ))}
                                        </ul>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </Tile>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-20">
                            <Tile>
                                <Label>Preview</Label>
                                <Preview draft={draft} links={pageLinks} />
                            </Tile>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save bar */}
            {dirty && (
                <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
                    <div className="flex items-center gap-3 rounded-full bg-[#18181A] py-2 pl-5 pr-2 text-[13px] text-white shadow-2xl">
                        <span>Unsaved changes</span>
                        <button onClick={() => { setDraft(saved); setHandleState('same'); }} className="rounded-full px-3 py-1.5 text-[#A19E97] hover:text-white">Undo</button>
                        <button onClick={save} disabled={saving || handleState === 'taken' || handleState === 'short' || handleState === 'checking'}
                            className="inline-flex items-center gap-2 rounded-full bg-[#FF5A14] px-4 py-1.5 font-medium hover:opacity-90 disabled:opacity-40">
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BioDashboard;
