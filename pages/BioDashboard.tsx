import React, { useState, useEffect } from 'react';
import { Plus, UserCircle2, ExternalLink, Trash2, Edit, Layout } from 'lucide-react';
import { BioProfile, LinkData } from '../types';
import { getBioProfiles, saveBioProfile, deleteBioProfile, getLinks } from '../services/storageService';
import { v4 as uuidv4 } from 'uuid';

const BioDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<BioProfile[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProfile, setCurrentProfile] = useState<Partial<BioProfile>>({});
    const [availableLinks, setAvailableLinks] = useState<LinkData[]>([]);

    useEffect(() => {
        setProfiles(getBioProfiles());
        setAvailableLinks(getLinks());
    }, []);

    const handleCreateNew = () => {
        setCurrentProfile({
            id: uuidv4(),
            handle: '',
            displayName: '',
            bio: '',
            avatarUrl: '',
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

    const handleSave = () => {
        if (!currentProfile.handle || !currentProfile.displayName) return;

        // Ensure links array exists
        const profileToSave: BioProfile = {
            ...currentProfile as BioProfile,
            links: currentProfile.links || []
        };

        saveBioProfile(profileToSave);
        setProfiles(getBioProfiles());
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this bio profile?')) {
            deleteBioProfile(id);
            setProfiles(getBioProfiles());
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

    if (isEditing) {
        return (
            <div className="p-8 max-w-4xl mx-auto pl-72">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    {currentProfile.id ? 'Edit Profile' : 'Create Bio Profile'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-slate-900 font-bold mb-4">Profile Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-stone-500 block mb-1">Handle (URL slug)</label>
                                    <div className="flex bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
                                        <span className="px-3 py-2 text-stone-400 text-sm bg-stone-100">link.ly/p/</span>
                                        <input
                                            type="text"
                                            value={currentProfile.handle}
                                            onChange={e => setCurrentProfile({ ...currentProfile, handle: e.target.value })}
                                            className="flex-1 bg-transparent border-none text-slate-900 focus:ring-0 p-2"
                                            placeholder="alex"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 block mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={currentProfile.displayName}
                                        onChange={e => setCurrentProfile({ ...currentProfile, displayName: e.target.value })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900"
                                        placeholder="Alex Chen"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 block mb-1">Bio</label>
                                    <textarea
                                        value={currentProfile.bio}
                                        onChange={e => setCurrentProfile({ ...currentProfile, bio: e.target.value })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900 h-20"
                                        placeholder="Tech enthusiast & content creator."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 block mb-1">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={currentProfile.avatarUrl}
                                        onChange={e => setCurrentProfile({ ...currentProfile, avatarUrl: e.target.value })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 block mb-1">Theme</label>
                                    <select
                                        value={currentProfile.theme}
                                        onChange={e => setCurrentProfile({ ...currentProfile, theme: e.target.value as any })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-slate-900"
                                    >
                                        <option value="dark">Dark Slate</option>
                                        <option value="light">Minimal Light</option>
                                        <option value="blue">Electric Blue</option>
                                        <option value="purple">Royal Purple</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white border border-stone-200 rounded-xl p-6 h-full flex flex-col shadow-sm">
                            <h3 className="text-slate-900 font-bold mb-4">Select Links to Display</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] custom-scrollbar">
                                {availableLinks.length === 0 && <p className="text-stone-500 text-sm">No links created yet.</p>}
                                {availableLinks.map(link => (
                                    <label key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={currentProfile.links?.includes(link.id)}
                                            onChange={() => toggleLinkSelection(link.id)}
                                            className="w-4 h-4 rounded border-stone-300 bg-white text-yellow-600 focus:ring-yellow-500"
                                        />
                                        <div className="overflow-hidden">
                                            <p className="text-slate-900 text-sm font-medium truncate">{link.title}</p>
                                            <p className="text-stone-500 text-xs truncate">{link.shortCode}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-stone-500 hover:text-slate-900">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-yellow-400 text-slate-900 rounded-xl font-bold hover:bg-yellow-500 shadow-sm shadow-yellow-400/20">Save Profile</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pl-64">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Link-in-Bio Profiles</h1>
                        <p className="text-stone-500">Manage your personal landing pages.</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm shadow-yellow-400/20"
                    >
                        <Plus className="w-5 h-5" /> Create Profile
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.length === 0 ? (
                        <div className="col-span-3 text-center py-20 bg-white border border-stone-200 border-dashed rounded-2xl">
                            <UserCircle2 className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                            <p className="text-stone-500 mb-4">No profiles found.</p>
                            <button onClick={handleCreateNew} className="text-yellow-600 font-bold hover:text-yellow-700">Create your first Link-in-Bio</button>
                        </div>
                    ) : (
                        profiles.map(profile => (
                            <div key={profile.id} className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-yellow-400 transition-all group shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                                        {profile.avatarUrl ? (
                                            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
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
                                        href={`#/p/${profile.handle}`}
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
            </div>
        </div>
    );
};

export default BioDashboard;