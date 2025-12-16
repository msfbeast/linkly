import React from 'react';
import { BioProfile, LinkData } from '../types';
import VibrantBioTemplate from './bio-templates/VibrantBioTemplate';
import GlassBioTemplate from './bio-templates/GlassBioTemplate';
import IndustrialBioTemplate from './bio-templates/IndustrialBioTemplate';
import RetroPopBioTemplate from './bio-templates/RetroPopBioTemplate';
import CyberpunkBioTemplate from './bio-templates/CyberpunkBioTemplate';
import NeubrutalismBioTemplate from './bio-templates/NeubrutalismBioTemplate';
import LofiBioTemplate from './bio-templates/LofiBioTemplate';
import ClaymorphismBioTemplate from './bio-templates/ClaymorphismBioTemplate';
import BauhausBioTemplate from './bio-templates/BauhausBioTemplate';
import LabBioTemplate from './bio-templates/LabBioTemplate';
import ArchiveBioTemplate from './bio-templates/ArchiveBioTemplate';
import CustomBioTemplate from './bio-templates/CustomBioTemplate';
import BentoBioTemplate from './bio-templates/BentoBioTemplate';
import NeoPopBioTemplate from './bio-templates/NeoPopBioTemplate';
import EditorialBioTemplate from './bio-templates/EditorialBioTemplate';
import SwissBioTemplate from './bio-templates/SwissBioTemplate';
import MidnightBioTemplate from './bio-templates/MidnightBioTemplate';
import NatureBioTemplate from './bio-templates/NatureBioTemplate';
import AuraBioTemplate from './bio-templates/AuraBioTemplate';
import PixelBioTemplate from './bio-templates/PixelBioTemplate';
import TerminalBioTemplate from './bio-templates/TerminalBioTemplate';
import PaperBioTemplate from './bio-templates/PaperBioTemplate';
import LuxuryBioTemplate from './bio-templates/LuxuryBioTemplate';
import GamerBioTemplate from './bio-templates/GamerBioTemplate';
import AirBioTemplate from './bio-templates/AirBioTemplate';

interface BioPreviewProps {
    profile: Partial<BioProfile>;
    links: LinkData[];
}

const BioPreview: React.FC<BioPreviewProps> = ({ profile, links }) => {
    // Mock profile for preview if fields are missing
    const previewProfile: BioProfile = {
        id: 'preview',
        userId: '00000000-0000-0000-0000-000000000000',
        isPublished: true,
        handle: profile.handle || 'preview',
        displayName: profile.displayName || 'Your Name',
        bio: profile.bio || 'This is a preview of your bio page.',
        avatarUrl: profile.avatarUrl || '',
        theme: profile.theme || 'vibrant',
        customTheme: profile.customTheme,
        links: [],
        views: 0,
    };

    // Mock links for preview
    const previewLinks: LinkData[] = links.length > 0 ? links.slice(0, 3) : [
        { id: '1', title: 'My Awesome Website', originalUrl: 'https://example.com', shortCode: 'link1', clicks: 100, createdAt: Date.now(), tags: [], clickHistory: [] },
        { id: '2', title: 'Follow me on Twitter', originalUrl: 'https://twitter.com', shortCode: 'link2', clicks: 50, createdAt: Date.now(), tags: [], clickHistory: [] },
        { id: '3', title: 'Check out my Portfolio', originalUrl: 'https://portfolio.com', shortCode: 'link3', clicks: 75, createdAt: Date.now(), tags: [], clickHistory: [] },
    ];

    const renderTemplate = () => {
        if (previewProfile.customTheme) {
            return <CustomBioTemplate profile={previewProfile} links={previewLinks} />;
        }

        switch (previewProfile.theme as any) {
            case 'storefront': return <VibrantBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'vibrant': return <VibrantBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'glass': return <GlassBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'industrial': return <IndustrialBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'retro': return <RetroPopBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'cyberpunk': return <CyberpunkBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'neubrutalism': return <NeubrutalismBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'lofi': return <LofiBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'clay': return <ClaymorphismBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'bauhaus': return <BauhausBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'lab': return <LabBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'archive': return <ArchiveBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'bento': return <BentoBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'neopop': return <NeoPopBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'editorial': return <EditorialBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'swiss': return <SwissBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'midnight': return <MidnightBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'nature': return <NatureBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'aura': return <AuraBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'pixel': return <PixelBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'terminal': return <TerminalBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'paper': return <PaperBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'luxury': return <LuxuryBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'gamer': return <GamerBioTemplate profile={previewProfile} links={previewLinks} />;
            case 'air': return <AirBioTemplate profile={previewProfile} links={previewLinks} />;
            default: return <VibrantBioTemplate profile={previewProfile} links={previewLinks} />;
        }
    };

    return (
        <div className="relative w-full aspect-[9/16] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
            <div className="absolute inset-0 origin-top-left transform scale-[0.4] w-[250%] h-[250%] pointer-events-none select-none">
                {renderTemplate()}
            </div>

            {/* Overlay to prevent interaction */}
            <div className="absolute inset-0 bg-transparent z-10" />

            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-900 shadow-sm z-20">
                Preview
            </div>
        </div>
    );
};

export default BioPreview;
