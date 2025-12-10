import React, { useState, useEffect } from 'react';
import {
    Layout, Palette, Camera, Mail, Smartphone,
    UserCircle2, ExternalLink, Edit, Search, Sparkles, Wand2, Loader2,
    Music, MapPin, Play, Plus, Trash2, GripVertical, Save, X,
    ChevronRight, ArrowUpRight, Monitor, Share2, MoreHorizontal
} from 'lucide-react';
import { BioProfile, LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { generateBio } from '../services/geminiService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import BioPreview from '../components/BioPreview';
import BioAppearanceEditor from '../components/BioAppearanceEditor';
import BioSeoEditor from '../components/BioSeoEditor';
import { SortableBioLinkItem } from '../components/SortableBioLinkItem';
import { GalleryManager } from '../components/GalleryManager';
import { TechVaultManager } from '../components/TechVaultManager';
import { NewsletterManager } from '../components/NewsletterManager';
import { AppStackManager } from '../components/AppStackManager';
import { ThemeGallery } from '../components/ThemeGallery';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { BioBlock } from '../components/BioBlock';
import { BioAnalyticsDashboard } from '../components/BioAnalyticsDashboard';
import { BlockGalleryModal, BlockType } from '../components/BlockGalleryModal';
import { WidgetConfigModal } from '../components/WidgetConfigModal';
import { BarChart3 } from 'lucide-react';

const BioDashboard: React.FC = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<BioProfile[]>([]);
    const [currentProfile, setCurrentProfile] = useState<Partial<BioProfile>>({});
    const [availableLinks, setAvailableLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    const [showBioPrompt, setShowBioPrompt] = useState(false);
    const [bioPrompt, setBioPrompt] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showBlockGallery, setShowBlockGallery] = useState(false);
    const [configWidgetType, setConfigWidgetType] = useState<BlockType | null>(null);

    // New State for Split Layout
    const [activeTab, setActiveTab] = useState<'content' | 'appearance'>('content');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Force Dark Mode for this page body
    useEffect(() => {
        document.body.style.backgroundColor = '#0a0a0a';
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (!user) return;
            const [fetchedProfiles, fetchedLinks] = await Promise.all([
                supabaseAdapter.getBioProfiles(user.id),
                supabaseAdapter.getLinks()
            ]);

            setProfiles(fetchedProfiles);
            setAvailableLinks(fetchedLinks);

            // Auto-select first profile or create new template if none
            if (fetchedProfiles.length > 0) {
                setCurrentProfile(fetchedProfiles[0]);
            } else {
                handleCreateNew();
            }

        } catch (error) {
            console.error('Error fetching bio data:', error);
        } finally {
            setLoading(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCreateNew = () => {
        setCurrentProfile({
            id: uuidv4(),
            handle: '',
            displayName: user?.displayName || '',
            bio: '',
            avatarUrl: user?.avatar_url || '',
            theme: 'vibrant',
            links: [],
            views: 0
        });
    };

    // Auto-save effect (debounced)
    useEffect(() => {
        if (!currentProfile.id || !user) return;

        const saveTimer = setTimeout(async () => {
            // Only save if we have basic requirements
            if (!currentProfile.handle) return;

            try {
                const isExisting = profiles.some(p => p.id === currentProfile.id);
                if (isExisting) {
                    await supabaseAdapter.updateBioProfile(currentProfile.id, currentProfile);
                } else {
                    // Create new logic handled by manual save usually, but for now we rely on explicit save for creation
                    // to avoid creating junk profiles while typing
                }
            } catch (err) {
                console.error("Auto-save failed", err);
            }
        }, 2000);

        return () => clearTimeout(saveTimer);
    }, [currentProfile, profiles, user]);


    const handleAddWidget = async (type: BlockType) => {
        if (type === 'newsletter') {
            // In the new layout, we might just focus the newsletter section
            toast.info("Newsletter section is in the Widgets area.");
            return;
        } else if (type === 'social_feed') {
            toast.info("Social Feed integration coming soon!");
            return;
        } else if (type === 'link') {
            setShowLinkModal(true);
            return;
        } else if (type === 'tip_jar') {
            handleWidgetConfigSubmit({}, 'tip_jar');
            return;
        }
        setConfigWidgetType(type);
    };

    const handleWidgetConfigSubmit = async (metadata: any, typeOverride?: BlockType) => {
        const type = typeOverride || configWidgetType;
        if (!type || !user) return;

        let title = 'New Widget';
        if (type === 'music') title = 'Music Player';
        if (type === 'video') title = 'Video';
        if (type === 'poll') title = 'Poll';
        if (type === 'qna') title = 'Q&A';
        if (type === 'map') title = 'Location';
        if (type === 'tip_jar') title = 'Support Me';

        try {
            const newLink = await supabaseAdapter.createLink({
                originalUrl: 'widget://' + type,
                shortCode: Math.random().toString(36).substring(7),
                title,
                tags: ['widget'],
                createdAt: Date.now(),
                clicks: 0,
                clickHistory: [],
                type,
                layoutConfig: { w: type === 'music' ? 2 : 1, h: 1 },
                metadata
            });
            setAvailableLinks([newLink, ...availableLinks]);

            // Auto add to profile links
            const currentLinks = currentProfile.links || [];
            setCurrentProfile({ ...currentProfile, links: [...currentLinks, newLink.id] });

            toast.success(`${title} added!`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create widget");
        }
    };

    const handleResizeBlock = async (id: string, size: { w: number; h: number }) => {
        const updatedLinks = availableLinks.map(l =>
            l.id === id ? { ...l, layoutConfig: size } : l
        );
        setAvailableLinks(updatedLinks);
        await supabaseAdapter.updateLink(id, { layoutConfig: size });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const currentLinks = currentProfile.links || [];
            const oldIndex = currentLinks.indexOf(active.id as string);
            const newIndex = currentLinks.indexOf(over?.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newLinks = arrayMove(currentLinks, oldIndex, newIndex);
                setCurrentProfile({ ...currentProfile, links: newLinks });
            }
        }
    };

    const toggleLinkSelection = (linkId: string) => {
        const currentLinks = currentProfile.links || [];
        if (currentLinks.includes(linkId)) {
            setCurrentProfile({ ...currentProfile, links: currentLinks.filter(id => id !== linkId) });
        } else {
            setCurrentProfile({ ...currentProfile, links: [...currentLinks, linkId] });
        }
    };

    const activeLinksList = (currentProfile.links || [])
        .map(id => availableLinks.find(l => l.id === id))
        .filter((l): l is LinkData => !!l);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0a] text-stone-200 overflow-hidden font-sans">
            {/* LEFT PANE: Editor */}
            <div className="w-full md:w-[500px] lg:w-[600px] flex flex-col border-r border-white/5 bg-[#0a0a0a] h-full shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-10">
                {/* Header & Tabs */}
                <div className="p-6 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">BioLink AI</h1>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'content'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-stone-500 hover:text-stone-300'
                                }`}
                        >
                            <Layout className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Content
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'appearance'
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-stone-500 hover:text-stone-300'
                                }`}
                        >
                            <Palette className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                            Appearance
                        </button>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {activeTab === 'content' && (
                        <div className="space-y-8 animate-fadeIn">
                            {/* Profile Details Section */}
                            <section className="space-y-4">
                                <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                                    <UserCircle2 className="w-3 h-3" /> Profile Details
                                </h2>
                                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-5 hover:border-white/10 transition-colors">
                                    {/* Avatar & Handle */}
                                    <div className="flex gap-5">
                                        <div className="shrink-0 relative group cursor-pointer">
                                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                {currentProfile.avatarUrl ? (
                                                    <img src={currentProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 className="w-10 h-10 text-white/20" />
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                                                <Edit className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="text-xs text-stone-500 font-medium mb-1.5 block">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={currentProfile.displayName}
                                                    onChange={e => setCurrentProfile({ ...currentProfile, displayName: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-stone-700"
                                                    placeholder="Alex Developer"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-stone-500 font-medium mb-1.5 block">Handle</label>
                                                <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden group focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                                    <span className="px-3 py-2 text-stone-500 text-sm border-r border-white/5 bg-white/5">@</span>
                                                    <input
                                                        type="text"
                                                        value={currentProfile.handle}
                                                        onChange={e => setCurrentProfile({ ...currentProfile, handle: e.target.value })}
                                                        className="flex-1 bg-transparent border-none text-white text-sm p-2 outline-none placeholder:text-stone-700"
                                                        placeholder="alex.dev"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs text-stone-500 font-medium">Bio</label>
                                            <button
                                                onClick={() => setShowBioPrompt(!showBioPrompt)}
                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                AI Enhance
                                            </button>
                                        </div>

                                        {showBioPrompt && (
                                            <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-fadeIn">
                                                <textarea
                                                    value={bioPrompt}
                                                    onChange={(e) => setBioPrompt(e.target.value)}
                                                    placeholder="Describe yourself..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-white mb-2 focus:border-indigo-500 outline-none"
                                                    rows={2}
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (!bioPrompt.trim()) return;
                                                        setIsGeneratingBio(true);
                                                        try {
                                                            const bio = await generateBio(bioPrompt, currentProfile.bio);
                                                            setCurrentProfile(prev => ({ ...prev, bio }));
                                                            setShowBioPrompt(false);
                                                            setBioPrompt('');
                                                        } catch (err) {
                                                            toast.error("Failed");
                                                        } finally {
                                                            setIsGeneratingBio(false);
                                                        }
                                                    }}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 rounded-md transition-colors"
                                                >
                                                    {isGeneratingBio ? 'Generatng...' : 'Generate Magic Bio'}
                                                </button>
                                            </div>
                                        )}

                                        <textarea
                                            value={currentProfile.bio}
                                            onChange={e => setCurrentProfile({ ...currentProfile, bio: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-stone-300 h-24 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-stone-700"
                                            placeholder="Frontend wizard creating magic with React & AI."
                                        />
                                    </div>

                                    {/* Avatar URL (Hidden Logic for now, or advanced) */}
                                    <div className="pt-2">
                                        <label className="text-xs text-stone-600 font-medium mb-1.5 block">Avatar Image URL</label>
                                        <input
                                            type="text"
                                            value={currentProfile.avatarUrl}
                                            onChange={e => setCurrentProfile({ ...currentProfile, avatarUrl: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-stone-500 text-xs focus:text-white focus:border-white/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Links Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                                        <Layout className="w-3 h-3" /> Links & Widgets
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowBlockGallery(true)}
                                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Active Blocks List */}
                                <div className="space-y-3">
                                    {activeLinksList.length === 0 ? (
                                        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                                            <p className="text-stone-500 text-sm mb-3">Your page is empty.</p>
                                            <button
                                                onClick={() => setShowLinkModal(true)}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
                                            >
                                                + Add First Link
                                            </button>
                                        </div>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={activeLinksList.map(l => l.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <div className="space-y-3">
                                                    {activeLinksList.map(link => (
                                                        <BioBlock
                                                            key={link.id}
                                                            link={link}
                                                            profile={currentProfile as BioProfile}
                                                            onRemove={() => toggleLinkSelection(link.id)}
                                                            onResize={handleResizeBlock}
                                                            className="bg-[#121212] border-white/5 text-white hover:border-white/20"
                                                        />
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    )}

                                    <button
                                        onClick={() => setShowLinkModal(true)}
                                        className="w-full py-3 bg-white/5 border border-white/5 border-dashed rounded-xl text-stone-400 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Add New Link
                                    </button>
                                </div>
                            </section>

                            {/* Widgets Accordions (Simplified) */}
                            <section className="space-y-2 pt-4 border-t border-white/5">
                                <details className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-stone-400" />
                                            <span className="text-sm font-medium text-stone-300">Newsletter Form</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-stone-500 group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                                        <NewsletterManager />
                                    </div>
                                </details>

                                <details className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="w-4 h-4 text-stone-400" />
                                            <span className="text-sm font-medium text-stone-300">App Stack</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-stone-500 group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                                        <AppStackManager />
                                    </div>
                                </details>

                                <details className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Camera className="w-4 h-4 text-stone-400" />
                                            <span className="text-sm font-medium text-stone-300">Tech Vault</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-stone-500 group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                                        <TechVaultManager />
                                    </div>
                                </details>
                            </section>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Theme Gallery - Need to wrap to look good in dark mode */}
                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">Themes</h2>
                                <ThemeGallery
                                    currentTheme={currentProfile.theme || 'vibrant'}
                                    currentCustomTheme={currentProfile.customTheme}
                                    onSelect={(theme) => setCurrentProfile({ ...currentProfile, theme: theme as any, customTheme: undefined })}
                                    onSelectCustom={(config) => setCurrentProfile({ ...currentProfile, customTheme: config })}
                                />
                            </div>

                            {/* Appearance Editor */}
                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">Customizer</h2>
                                {currentProfile.id && (
                                    <BioAppearanceEditor
                                        profile={currentProfile as BioProfile}
                                        onChange={(updates) => setCurrentProfile(prev => ({ ...prev, ...updates }))}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Preview (Sticky, Responsive) */}
            <div className="flex-1 hidden md:flex items-center justify-center relative bg-black">
                {/* Grid Background */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                {/* Phone Mockup Container */}
                <div className="relative z-10 scale-[0.85] lg:scale-100 transition-transform duration-500">
                    <div className="w-[375px] h-[780px] bg-[#000] rounded-[50px] shadow-[0_0_0_12px_#1a1a1a,0_0_0_14px_#333,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden relative ring-1 ring-white/10">
                        {/* Dynamic Island / Notch Area */}
                        <div className="absolute top-0 inset-x-0 h-8 bg-black z-50 flex justify-center pt-2">
                            <div className="w-24 h-6 bg-[#000] rounded-full relative z-50">
                                <div className="absolute top-0 inset-x-2 h-full bg-[#111] rounded-full border border-white/5" />
                            </div>
                        </div>

                        {/* Screen Content */}
                        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-black">
                            <BioPreview profile={currentProfile} links={availableLinks.filter(l => currentProfile.links?.includes(l.id))} />
                        </div>
                    </div>
                </div>

                {/* Bottom Actions for Preview */}
                <div className="absolute bottom-8 flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium backdrop-blur-md transition-colors border border-white/5">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <a
                        href={`/p/${currentProfile.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" /> Visit Active Page
                    </a>
                </div>
            </div>

            {/* Modals */}
            <BlockGalleryModal
                isOpen={showBlockGallery}
                onClose={() => setShowBlockGallery(false)}
                onSelect={(type) => { setShowBlockGallery(false); handleAddWidget(type); }}
            />
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Add New Link</h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-stone-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const url = formData.get('url') as string;
                                const title = formData.get('title') as string;
                                if (!url || !title) return;
                                try {
                                    const newLink = await supabaseAdapter.createLink({
                                        originalUrl: url,
                                        shortCode: Math.random().toString(36).substring(7),
                                        title,
                                        tags: [],
                                        createdAt: Date.now(),
                                        clicks: 0,
                                        clickHistory: [],
                                        type: 'link',
                                        layoutConfig: { w: 1, h: 1 },
                                        metadata: {}
                                    });
                                    setAvailableLinks([newLink, ...availableLinks]);
                                    const currentLinks = currentProfile.links || [];
                                    setCurrentProfile({ ...currentProfile, links: [...currentLinks, newLink.id] });
                                    toast.success("Link added!");
                                    setShowLinkModal(false);
                                } catch (error) {
                                    toast.error("Failed");
                                }
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Title</label>
                                <input name="title" required placeholder="My Website" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">URL</label>
                                <input name="url" type="url" required placeholder="https://..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                                Add Link
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <WidgetConfigModal
                isOpen={!!configWidgetType}
                type={configWidgetType}
                onClose={() => setConfigWidgetType(null)}
                onSubmit={handleWidgetConfigSubmit}
            />
        </div>
    );
};

export default BioDashboard;