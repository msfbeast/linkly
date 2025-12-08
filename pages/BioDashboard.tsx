import React, { useState, useEffect } from 'react';
import {
    Layout, Palette, Camera, Mail, Smartphone,
    UserCircle2, ExternalLink, Edit, Search, Sparkles, Wand2, Loader2,
    Music, MapPin, Play, Plus, Trash2, GripVertical, Save, X
} from 'lucide-react';
import { BioProfile, LinkData } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { generateBio } from '../services/geminiService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import BioPreview from '../components/BioPreview';
import BioAppearanceEditor from '../components/BioAppearanceEditor';
import { SortableBioLinkItem } from '../components/SortableBioLinkItem';
import { GalleryManager } from '../components/GalleryManager';
import { NewsletterManager } from '../components/NewsletterManager';
import { AppStackManager } from '../components/AppStackManager';
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

const BioDashboard: React.FC = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<BioProfile[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProfile, setCurrentProfile] = useState<Partial<BioProfile>>({});
    const [availableLinks, setAvailableLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    const [showBioPrompt, setShowBioPrompt] = useState(false);
    const [bioPrompt, setBioPrompt] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

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

    const handleAddWidget = async (type: 'music' | 'map' | 'video') => {
        let metadata = {};
        let title = 'New Widget';

        if (type === 'music') {
            title = 'Music Player';
            const url = prompt("Enter Spotify or Apple Music URL:");
            if (!url) return;
            metadata = { platform: url.includes('apple') ? 'apple' : 'spotify', embedUrl: url };
        } else if (type === 'map') {
            title = 'Location';
            const address = prompt("Enter Address:");
            if (!address) return;
            // Mock Geocode for now (Random generic location)
            metadata = { lat: 40.7128, lng: -74.0060, address };
        } else if (type === 'video') {
            title = 'Video';
            const url = prompt("Enter YouTube URL:");
            if (!url) return;
            // Extract ID (simple regex)
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            metadata = { videoId, videoPlatform: 'youtube' };
        }

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
                layoutConfig: { w: type === 'music' ? 2 : 1, h: 1 }, // Default music to full width
                metadata
            });
            setAvailableLinks([newLink, ...availableLinks]);
            toast.success(`${title} added!`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create widget");
        }
    };

    const handleResizeBlock = async (id: string, size: { w: number; h: number }) => {
        // Optimistic UI update
        const updatedLinks = availableLinks.map(l =>
            l.id === id ? { ...l, layoutConfig: size } : l
        );
        setAvailableLinks(updatedLinks);

        try {
            await supabaseAdapter.updateLink(id, { layoutConfig: size });
        } catch (error) {
            console.error("Failed to resize block:", error);
            toast.error("Failed to save size");
            fetchData();
        }
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

    const handleCreateNew = () => {
        setCurrentProfile({
            id: uuidv4(),
            handle: '',
            displayName: user?.displayName || '',
            bio: '',
            avatarUrl: user?.avatar_url || '',
            theme: 'dark',
            links: [],
            views: 0
        });
        setIsEditing(true);
    };

    const handleEdit = (profile: BioProfile) => {
        setCurrentProfile({ ...profile });
        setIsEditing(true);
    };

    const handleSave = async () => {
        console.log('handleSave called', currentProfile);
        if (!currentProfile.handle || !currentProfile.displayName) {
            toast.error('Please fill in the Handle and Display Name fields.');
            return;
        }

        try {
            // Check if we are updating an existing profile
            const isUpdating = profiles.some(p => p.id === currentProfile.id);
            console.log('isUpdating:', isUpdating, 'id:', currentProfile.id);

            if (isUpdating && currentProfile.id) {
                await supabaseAdapter.updateBioProfile(currentProfile.id, {
                    ...currentProfile,
                    links: currentProfile.links || []
                });
            } else {
                // Creating new profile
                // Remove ID if it was auto-generated by uuidv4() in handleCreateNew
                // The adapter/DB will generate a real ID
                const { id, views, ...newProfileData } = currentProfile as BioProfile;
                console.log('Creating profile with data:', newProfileData);
                await supabaseAdapter.createBioProfile({
                    ...newProfileData,
                    links: currentProfile.links || []
                });
            }

            fetchData();
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error saving profile:', error);
            if (error.message?.includes('duplicate key value violates unique constraint')) {
                toast.error('This handle is already taken. Please choose another one.');
            } else {
                toast.error(`Failed to save profile: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this bio profile?')) {
            try {
                await supabaseAdapter.deleteBioProfile(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting profile:', error);
                toast.error('Failed to delete profile.');
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

    const inactiveLinksList = availableLinks.filter(l => !(currentProfile.links || []).includes(l.id));

    const filteredProfiles = profiles.filter(profile =>
        (profile.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.handle || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isEditing) {
        return (
            <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {currentProfile.id ? 'Edit Profile' : 'Create Bio Profile'}
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-stone-500 hover:text-slate-900">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20">Save Profile</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left & Center Columns (Edit Widgets) */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Identity Card (Full Width) */}
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCircle2 className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 block mb-1 uppercase">Handle</label>
                                        <div className="flex bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
                                            <span className="px-3 py-2 text-stone-400 text-sm bg-stone-100 border-r border-stone-200">links.trak.in/p/</span>
                                            <input
                                                type="text"
                                                value={currentProfile.handle}
                                                onChange={e => setCurrentProfile({ ...currentProfile, handle: e.target.value })}
                                                className="flex-1 bg-transparent border-none text-slate-900 focus:ring-0 p-2 font-medium"
                                                placeholder="alex"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 block mb-1 uppercase">Display Name</label>
                                        <input
                                            type="text"
                                            value={currentProfile.displayName}
                                            onChange={e => setCurrentProfile({ ...currentProfile, displayName: e.target.value })}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Alex Chen"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-stone-500 uppercase">Bio</label>
                                            {!showBioPrompt ? (
                                                <button
                                                    onClick={() => setShowBioPrompt(true)}
                                                    className="text-xs text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                                >
                                                    <Wand2 className="w-3 h-3" />
                                                    AI Write
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowBioPrompt(false)}
                                                    className="text-xs text-stone-400 hover:text-stone-500"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>

                                        {showBioPrompt && (
                                            <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-fadeIn">
                                                <textarea
                                                    value={bioPrompt}
                                                    onChange={(e) => setBioPrompt(e.target.value)}
                                                    placeholder="E.g., Tech reviewer who loves coffee and minimal setups..."
                                                    className="w-full bg-white border border-indigo-200 rounded-md p-2 text-sm mb-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    rows={2}
                                                    autoFocus
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
                                                            toast.error("Failed to generate bio");
                                                        } finally {
                                                            setIsGeneratingBio(false);
                                                        }
                                                    }}
                                                    disabled={isGeneratingBio || !bioPrompt.trim()}
                                                    className="w-full bg-indigo-500 text-white font-bold py-1.5 rounded-md text-xs hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isGeneratingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    Generate Bio
                                                </button>
                                            </div>
                                        )}

                                        <textarea
                                            value={currentProfile.bio}
                                            onChange={e => setCurrentProfile({ ...currentProfile, bio: e.target.value })}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900 h-[108px] resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Tech enthusiast & content creator."
                                        />
                                    </div>
                                    <div className="hidden">
                                        <label className="text-xs font-bold text-stone-500 block mb-1 uppercase">Avatar URL</label>
                                        <input
                                            type="text"
                                            value={currentProfile.avatarUrl}
                                            onChange={e => setCurrentProfile({ ...currentProfile, avatarUrl: e.target.value })}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Content Card (Link Management) - Full Width */}
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm min-h-[500px] flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Layout className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">Content</h3>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                {/* Active Links */}
                                <div className="flex flex-col h-full">
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                                        Active Links ({activeLinksList.length})
                                    </h4>
                                    <div className="flex-1 bg-stone-50 rounded-xl p-4 border border-stone-100 overflow-y-auto max-h-[400px] custom-scrollbar">
                                        {activeLinksList.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-stone-400 text-sm">No blocks added yet.</p>
                                                <p className="text-stone-400 text-xs mt-1">Add widgets or links below.</p>
                                            </div>
                                        ) : (
                                            <div className="min-h-[200px]">
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={activeLinksList.map(l => l.id)}
                                                        strategy={rectSortingStrategy}
                                                    >
                                                        <div className="grid grid-cols-2 gap-3 auto-rows-min">
                                                            {activeLinksList.map(link => (
                                                                <BioBlock
                                                                    key={link.id}
                                                                    link={link}
                                                                    onRemove={() => toggleLinkSelection(link.id)}
                                                                    onResize={handleResizeBlock}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Available Links */}
                                <div className="flex flex-col h-full">
                                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                                        Available Links ({inactiveLinksList.length})
                                    </h4>
                                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar space-y-2 pr-2">
                                        {inactiveLinksList.length === 0 && <p className="text-stone-400 text-sm italic">No more links available.</p>}
                                        {inactiveLinksList.map(link => (
                                            <button
                                                key={link.id}
                                                onClick={() => toggleLinkSelection(link.id)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 hover:border-indigo-400/50 transition-all group text-left bg-white"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-slate-900 text-sm font-medium truncate group-hover:text-indigo-700 transition-colors">{link.title}</p>
                                                    <p className="text-stone-500 text-xs truncate">{link.shortCode}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Appearance Card */}
                        <div className="md:row-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">Appearance</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 block mb-2 uppercase">Theme Preset</label>
                                    <select
                                        value={currentProfile.theme}
                                        onChange={e => setCurrentProfile({ ...currentProfile, theme: e.target.value as any })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="vibrant">Vibrant (Pop!)</option>
                                        <option value="glass">Glass (Modern Dark)</option>
                                        <option value="industrial">Industrial (Technical)</option>
                                        <option value="retro">Retro Pop (90s)</option>
                                        <option value="cyberpunk">Cyberpunk (Neon)</option>
                                        <option value="neubrutalism">Neubrutalism (Bold)</option>
                                        <option value="lofi">Lofi (Chill)</option>
                                        <option value="clay">Claymorphism (Soft 3D)</option>
                                        <option value="bauhaus">Bauhaus (Geometric)</option>
                                        <option value="lab">Lab (Scientific)</option>
                                        <option value="archive">Archive (Vintage)</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    {currentProfile.id && (
                                        <BioAppearanceEditor
                                            profile={currentProfile as BioProfile}
                                            onChange={(updates) => setCurrentProfile(prev => ({ ...prev, ...updates }))}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Tech Vault Card */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Camera className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">Tech Vault</h3>
                            </div>
                            <GalleryManager />
                        </div>

                        {/* 5. Apps Card */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Smartphone className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">App Stack</h3>
                            </div>
                            <AppStackManager />
                        </div>

                        {/* 6. Newsletter Card */}
                        <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Mail className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-slate-900 font-bold">Newsletter</h3>
                            </div>
                            <NewsletterManager />
                        </div>

                    </div>

                    {/* Right Column (Sticky Preview) */}
                    <div className="lg:col-span-4 sticky top-8">
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-lg shadow-stone-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-slate-900 font-bold">Live Preview</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                            </div>
                            <div className="flex justify-center bg-stone-50 rounded-xl p-6 border border-stone-100">
                                <div className="w-64 shadow-2xl rounded-[2.5rem] overflow-hidden border-8 border-slate-900 bg-white ring-1 ring-black/5">
                                    <BioPreview profile={currentProfile} links={availableLinks.filter(l => currentProfile.links?.includes(l.id))} />
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-stone-400">Updates automatically as you edit</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link-in-Bio Profiles</h1>
                        <p className="text-stone-500">Manage your personal landing pages.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search profiles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowLinkModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Add Link
                            </button>
                            <div className="h-6 w-px bg-stone-300 mx-2" />
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2">Widgets</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddWidget('music')}
                                    className="bg-white border border-stone-200 hover:border-indigo-500 text-stone-600 hover:text-indigo-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                    title="Add Music Player"
                                >
                                    <Music className="w-4 h-4" />
                                    Music
                                </button>
                                <button
                                    onClick={() => handleAddWidget('map')}
                                    className="bg-white border border-stone-200 hover:border-indigo-500 text-stone-600 hover:text-indigo-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                    title="Add Location Map"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Map
                                </button>
                                <button
                                    onClick={() => handleAddWidget('video')}
                                    className="bg-white border border-stone-200 hover:border-indigo-500 text-stone-600 hover:text-indigo-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                    title="Add Video Embed"
                                >
                                    <Play className="w-4 h-4" />
                                    Video
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProfiles.length === 0 ? (
                        <div className="col-span-3 text-center py-20 bg-white border border-stone-200 border-dashed rounded-2xl">
                            <UserCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                            <p className="text-stone-500 mb-4">
                                {searchQuery ? 'No profiles match your search.' : 'No profiles found.'}
                            </p>
                            <button onClick={handleCreateNew} className="text-yellow-600 font-bold hover:text-yellow-700">Create your first Link-in-Bio</button>
                        </div>
                    ) : (
                        filteredProfiles.map(profile => (
                            <div key={profile.id} className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-yellow-400 transition-all group shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                                        {profile.avatarUrl || user?.avatar_url ? (
                                            <img src={profile.avatarUrl || user?.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle2 className="w-8 h-8 text-stone-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold">{profile.displayName}</h3>
                                        <p className="text-stone-500 text-sm">@{profile.handle}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                                    <a
                                        href={`/p/${profile.handle}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-yellow-600 text-sm font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Visit
                                    </a>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(profile)} className="p-2 text-stone-400 hover:text-slate-900 hover:bg-stone-100 rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(profile.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Link Modal */}
                {showLinkModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Add New Link</h3>
                                <button onClick={() => setShowLinkModal(false)} className="text-stone-400 hover:text-slate-900">
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
                                        toast.success("Link added successfully!");
                                        setShowLinkModal(false);
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Failed to add link");
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Title</label>
                                    <input name="title" required placeholder="My Awesome Website" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-yellow-400 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">URL</label>
                                    <input name="url" type="url" required placeholder="https://example.com" className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-yellow-400 outline-none font-medium" />
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                                    Add Link
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BioDashboard;