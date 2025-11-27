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
        <h2 className="text-2xl font-bold text-white mb-6">
            {currentProfile.id ? 'Edit Profile' : 'Create Bio Profile'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4">Profile Details</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Handle (URL slug)</label>
                            <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                                <span className="px-3 py-2 text-slate-500 text-sm bg-slate-900/50">link.ly/p/</span>
                                <input 
                                    type="text" 
                                    value={currentProfile.handle} 
                                    onChange={e => setCurrentProfile({...currentProfile, handle: e.target.value})}
                                    className="flex-1 bg-transparent border-none text-white focus:ring-0 p-2"
                                    placeholder="alex"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={currentProfile.displayName} 
                                onChange={e => setCurrentProfile({...currentProfile, displayName: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                placeholder="Alex Chen"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Bio</label>
                            <textarea 
                                value={currentProfile.bio} 
                                onChange={e => setCurrentProfile({...currentProfile, bio: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white h-20"
                                placeholder="Tech enthusiast & content creator."
                            />
                        </div>
                         <div>
                            <label className="text-xs text-slate-400 block mb-1">Avatar URL</label>
                            <input 
                                type="text" 
                                value={currentProfile.avatarUrl} 
                                onChange={e => setCurrentProfile({...currentProfile, avatarUrl: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                             <label className="text-xs text-slate-400 block mb-1">Theme</label>
                             <select 
                                value={currentProfile.theme}
                                onChange={e => setCurrentProfile({...currentProfile, theme: e.target.value as any})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
                    <h3 className="text-white font-bold mb-4">Select Links to Display</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] custom-scrollbar">
                        {availableLinks.length === 0 && <p className="text-slate-500 text-sm">No links created yet.</p>}
                        {availableLinks.map(link => (
                            <label key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={currentProfile.links?.includes(link.id)}
                                    onChange={() => toggleLinkSelection(link.id)}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="overflow-hidden">
                                    <p className="text-white text-sm font-medium truncate">{link.title}</p>
                                    <p className="text-slate-500 text-xs truncate">{link.shortCode}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-slate-300 hover:text-white">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500">Save Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pl-64">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Link-in-Bio Profiles</h1>
                <p className="text-slate-400">Manage your personal landing pages.</p>
            </div>
            <button 
                onClick={handleCreateNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
                <Plus className="w-5 h-5" /> Create Profile
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.length === 0 ? (
                <div className="col-span-3 text-center py-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                    <UserCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">No profiles found.</p>
                    <button onClick={handleCreateNew} className="text-indigo-400 font-medium">Create your first Link-in-Bio</button>
                </div>
            ) : (
                profiles.map(profile => (
                    <div key={profile.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle2 className="w-8 h-8 text-slate-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{profile.displayName}</h3>
                                <p className="text-slate-500 text-sm">@{profile.handle}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                             <a 
                               href={`#/p/${profile.handle}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-indigo-400 text-sm font-medium flex items-center gap-1 hover:underline"
                             >
                                <ExternalLink className="w-3 h-3" /> Visit
                             </a>
                             <div className="flex gap-2">
                                 <button onClick={() => handleEdit(profile)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                                     <Edit className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDelete(profile.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg">
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