import React, { useEffect, useState } from 'react';
import { getBioProfileByHandle, getLinks } from '../services/storageService';
import { BioProfile, LinkData } from '../types';
import { UserCircle2, ExternalLink } from 'lucide-react';

interface BioViewProps {
  handle: string;
}

const BioView: React.FC<BioViewProps> = ({ handle }) => {
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);

  useEffect(() => {
    const foundProfile = getBioProfileByHandle(handle);
    if (foundProfile) {
      setProfile(foundProfile);
      const allLinks = getLinks();
      // Filter links that belong to this profile
      const profileLinks = allLinks.filter(l => foundProfile.links.includes(l.id));
      setLinks(profileLinks);
    }
  }, [handle]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Profile not found
      </div>
    );
  }

  // Theme Config
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'light': return 'bg-slate-50 text-slate-900';
      case 'blue': return 'bg-blue-900 text-white';
      case 'purple': return 'bg-purple-900 text-white';
      default: return 'bg-slate-950 text-white';
    }
  };

  const getButtonClasses = (theme: string) => {
    switch (theme) {
      case 'light': return 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100 shadow-sm';
      case 'blue': return 'bg-blue-800 border-blue-700 text-white hover:bg-blue-700';
      case 'purple': return 'bg-purple-800 border-purple-700 text-white hover:bg-purple-700';
      default: return 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center py-16 px-4 ${getThemeClasses(profile.theme)}`}>
        <div className="max-w-md w-full text-center">
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10 shadow-xl">
                 {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <UserCircle2 className="w-12 h-12 opacity-50" />
                    </div>
                 )}
            </div>

            {/* Info */}
            <h1 className="text-2xl font-bold mb-2">{profile.displayName}</h1>
            <p className="opacity-80 mb-10 text-sm leading-relaxed">{profile.bio}</p>

            {/* Links */}
            <div className="space-y-4">
                {links.map(link => (
                    <a 
                        key={link.id}
                        href={`#/r/${link.shortCode}`} // Route through our redirect handler for tracking
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block w-full py-4 px-6 rounded-xl border font-medium transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-between group ${getButtonClasses(profile.theme)}`}
                    >
                        <span>{link.title}</span>
                        <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-white/10 opacity-40 text-xs font-medium">
                Powered by Linkly AI
            </div>
        </div>
    </div>
  );
};

export default BioView;