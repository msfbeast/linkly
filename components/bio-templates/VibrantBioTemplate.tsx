import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Zap, Star } from 'lucide-react';
import { GalleryBlock } from '../blocks/GalleryBlock';
import { NewsletterBlock } from '../blocks/NewsletterBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const VibrantBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#F0F0F0] text-slate-900 font-sans selection:bg-[#FF3366] selection:text-white overflow-x-hidden">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-300 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF3366] rounded-full blur-[100px] opacity-30"></div>
            </div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6">

                {/* Header / Profile Info */}
                <div className="text-center mb-10 relative">
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-white relative z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#FF3366] flex items-center justify-center">
                                    <span className="text-4xl font-black text-white">{profile.displayName.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        {/* Decorative Elements around Avatar */}
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center z-20 animate-bounce-slow">
                            <Zap className="w-5 h-5 text-black fill-current" />
                        </div>
                        <div className="absolute -bottom-2 -left-4 bg-cyan-400 border-2 border-black px-3 py-1 rounded-full z-20 transform -rotate-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-black text-xs uppercase tracking-wider">Hello!</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black mb-2 tracking-tight">{profile.displayName}</h1>
                    <p className="font-bold text-gray-600 bg-white/50 inline-block px-4 py-1 rounded-full border-2 border-transparent hover:border-black transition-all">
                        @{profile.handle}
                    </p>
                    {profile.bio && (
                        <p className="mt-4 text-lg font-medium leading-relaxed max-w-xs mx-auto">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 space-y-4">
                    {links.map((link, i) => (
                        <a
                            key={link.id}
                            href={`/r/${link.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block bg-white border-4 border-black p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0`}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="font-black text-lg uppercase tracking-tight group-hover:text-[#FF3366] transition-colors">
                                    {link.title}
                                </span>
                                <div className="w-8 h-8 bg-yellow-300 rounded-full border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                            {/* Hover Effect Background */}
                            <div className="absolute inset-0 bg-stone-50 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
                        </a>
                    ))}
                </div>

                {/* Tech Vault (Gallery) */}
                <div className="mt-8">
                    <GalleryBlock userId={profile.userId} />
                </div>

                {/* Newsletter */}
                <div className="mt-4">
                    <NewsletterBlock userId={profile.userId} />
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 font-black text-sm uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Powered by Gather</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VibrantBioTemplate;
