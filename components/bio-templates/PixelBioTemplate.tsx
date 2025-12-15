import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { Gamepad2, Heart, Cpu } from 'lucide-react';
import { BioWidget } from '../BioWidget';
import { TechVaultBlock } from '../blocks/TechVaultBlock';
import { AppStackBlock } from '../blocks/AppStackBlock';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const PixelBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#2D2D2D] text-white font-mono p-4" style={{ imageRendering: 'pixelated' }}>
            <div className="max-w-md mx-auto">

                {/* Header Card */}
                <div className="border-4 border-white bg-[#3D3D3D] p-4 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-blue-500 border-4 border-black mb-4 overflow-hidden relative">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white">
                                    <Gamepad2 className="w-8 h-8" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border border-black animate-pulse"></div>
                        </div>
                        <h1 className="text-xl font-bold uppercase mb-1 tracking-wider text-yellow-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                            {profile.displayName}
                        </h1>
                        <div className="bg-black px-2 py-1 border border-white mb-2">
                            <p className="text-xs text-green-400">LVL 99 • {profile.handle}</p>
                        </div>
                        {profile.bio && (
                            <div className="text-xs text-center text-gray-300 leading-relaxed border-t-2 border-dashed border-gray-600 pt-2 w-full mt-2">
                                {profile.bio}
                            </div>
                        )}
                    </div>
                </div>

                {/* HP Bar Decoration */}
                <div className="flex items-center gap-2 mb-6 px-2">
                    <span className="text-xs font-bold text-red-400">HP</span>
                    <div className="flex-1 h-4 border-2 border-white bg-black">
                        <div className="h-full w-[85%] bg-red-500"></div>
                    </div>
                </div>

                {/* Links */}
                <div className="space-y-4">
                    {links.map((link) => {
                        if (link.type !== 'link') {
                            return (
                                <div key={link.id} className="border-4 border-white bg-[#0000AA] p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                    <BioWidget link={link} />
                                </div>
                            )
                        }

                        return (
                            <a
                                key={link.id}
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block bg-white border-4 border-black p-3 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-200 border-2 border-black flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                                        <Heart className="w-5 h-5 text-black fill-current" />
                                    </div>
                                    <span className="font-bold text-black uppercase tracking-tight">{link.title}</span>
                                </div>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-black font-black text-xs animate-bounce">PRESS START &gt;</span>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {/* Blocks */}
                <div className="mt-8">
                    {(profile.blockVisibility?.techVault !== false) && (
                        <div className="border-4 border-white bg-[#3D3D3D] p-4 mb-4">
                            <h3 className="text-yellow-400 font-bold uppercase mb-4 text-center">&gt; INVENTORY</h3>
                            <TechVaultBlock userId={profile.userId} variant="default" />
                        </div>
                    )}
                </div>

                <div className="text-center mt-8 pb-8 opacity-50 text-xs">
                    INSERT COIN TO CONTINUE
                </div>

            </div>
        </div>
    );
};

export default PixelBioTemplate;
