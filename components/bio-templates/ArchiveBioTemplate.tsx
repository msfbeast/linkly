import React from 'react';
import { BioProfile, LinkData } from '../../types';
import { ExternalLink, Archive, FileText } from 'lucide-react';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const ArchiveBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    return (
        <div className="min-h-screen bg-[#f4f1ea] text-[#2c2c2c] font-serif selection:bg-[#2c2c2c] selection:text-[#f4f1ea] overflow-x-hidden">
            {/* Paper Texture Overlay */}
            <div className="fixed inset-0 opacity-40 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-16 px-8 border-x border-[#dcd9d2] bg-[#f4f1ea]">

                {/* Header */}
                <div className="text-center mb-12 border-b-2 border-[#2c2c2c] pb-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full border border-[#2c2c2c] p-1">
                        <div className="w-full h-full rounded-full overflow-hidden grayscale sepia-[0.2]">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#e6e2d8] flex items-center justify-center">
                                    <Archive className="w-8 h-8 text-[#888]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-2">{profile.displayName}</h1>
                    <p className="text-sm italic text-[#666] mb-6">Est. 2024 • @{profile.handle}</p>

                    {profile.bio && (
                        <p className="text-sm leading-relaxed max-w-xs mx-auto font-medium">
                            "{profile.bio}"
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 space-y-6">
                    {links.map((link, i) => (
                        <div key={link.id} className="group">
                            <a
                                href={`/r/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-baseline justify-between hover:text-[#8b4513] transition-colors"
                            >
                                <span className="text-lg font-bold border-b border-[#ccc] group-hover:border-[#8b4513] pb-1 transition-all">
                                    {link.title}
                                </span>
                                <span className="text-xs text-[#999] group-hover:text-[#8b4513] transition-colors">
                                    Ref. {i + 1}
                                </span>
                            </a>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-20 text-center border-t border-[#dcd9d2] pt-6">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#888]">
                        <FileText className="w-3 h-3" />
                        <span>Archived by Gather</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchiveBioTemplate;
