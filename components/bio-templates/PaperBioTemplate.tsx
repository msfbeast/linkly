import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { Pen, Trash2, StickyNote } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const PaperBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#F0EBE3] text-[#2D2A26] p-6"
            style={{
                fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                backgroundImage: 'radial-gradient(#D7D2C8 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}>

            <div className="max-w-lg mx-auto relative">

                {/* Tape Effect */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#E6D5B8] opacity-80 rotate-1 shadow-sm z-20"></div>

                {/* Main Notebook Page */}
                <div className="bg-white p-8 md:p-12 shadow-[5px_5px_15px_rgba(0,0,0,0.1)] rotate-[-1deg] relative">

                    {/* Header */}
                    <div className="text-center mb-10 pb-8 border-b-2 border-dashed border-gray-300 relative">
                        <div className="inline-block relative">
                            <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-[#2D2A26] overflow-hidden mb-4 p-1">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Pen className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                            </div>
                            {/* Doodle Scribble */}
                            <svg className="absolute -bottom-2 -left-8 w-16 h-16 text-[#FF6B6B] opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M10,50 Q30,30 50,50 T90,50" />
                            </svg>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tighter mb-2 transform -rotate-2">{profile.displayName}</h1>
                        <p className="text-gray-500 font-bold tracking-widest text-sm">@{profile.handle}</p>

                        {profile.bio && (
                            <p className="mt-4 font-handwriting text-lg leading-relaxed text-[#555]">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {/* Links */}
                    <div className="space-y-6">
                        {links.map((link, i) => {
                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className="transform rotate-1 p-2 bg-yellow-50 border border-yellow-200 shadow">
                                        <BioWidget link={link} />
                                    </div>
                                )
                            }

                            const rotation = i % 2 === 0 ? 'rotate-1' : '-rotate-1';

                            return (
                                <a
                                    key={link.id}
                                    href={`/r/${link.shortCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block bg-white border-2 border-[#2D2A26] p-4 shadow-[4px_4px_0px_#2D2A26] hover:shadow-[1px_1px_0px_#2D2A26] hover:translate-x-[3px] hover:translate-y-[3px] transition-all transform ${rotation} hover:rotate-0`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-lg">{link.title}</span>
                                        <StickyNote className="w-5 h-5 text-gray-400" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>

                    {/* Doodle Footer */}
                    <div className="mt-12 text-center">
                        {(profile.blockVisibility?.techVault !== false) && (
                            <div className="mb-8 border-2 border-[#2D2A26] border-dashed p-4 rounded bg-gray-50">
                                <h3 className="font-bold uppercase text-xs mb-4">My Tools</h3>
                                <TechVaultBlock userId={profile.userId} variant="default" />
                            </div>
                        )}
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Handcrafted.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PaperBioTemplate;
