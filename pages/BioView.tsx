import React, { useEffect, useState } from 'react';
import { getBioProfileByHandle, getLinks } from '../services/storageService';
import { BioProfile, LinkData } from '../types';
import { UserCircle2, ExternalLink } from 'lucide-react';
import VibrantBioTemplate from '../components/bio-templates/VibrantBioTemplate';
import GlassBioTemplate from '../components/bio-templates/GlassBioTemplate';
import IndustrialBioTemplate from '../components/bio-templates/IndustrialBioTemplate';
import RetroPopBioTemplate from '../components/bio-templates/RetroPopBioTemplate';
import CyberpunkBioTemplate from '../components/bio-templates/CyberpunkBioTemplate';
import NeubrutalismBioTemplate from '../components/bio-templates/NeubrutalismBioTemplate';
import LofiBioTemplate from '../components/bio-templates/LofiBioTemplate';
import ClaymorphismBioTemplate from '../components/bio-templates/ClaymorphismBioTemplate';
import BauhausBioTemplate from '../components/bio-templates/BauhausBioTemplate';
import LabBioTemplate from '../components/bio-templates/LabBioTemplate';
import ArchiveBioTemplate from '../components/bio-templates/ArchiveBioTemplate';
import CustomBioTemplate from '../components/bio-templates/CustomBioTemplate';

import { useParams } from 'react-router-dom';

interface BioViewProps {
  handle?: string;
}

const BioView: React.FC<BioViewProps> = ({ handle: propHandle }) => {
  const { handle: paramHandle } = useParams<{ handle: string }>();
  const handle = propHandle || paramHandle || '';

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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-500">
        Profile not found
      </div>
    );
  }

  // Render Custom Template if configured
  if (profile.customTheme) {
    return <CustomBioTemplate profile={profile} links={links} />;
  }

  // Render the selected template
  switch (profile.theme) {
    case 'vibrant':
      return <VibrantBioTemplate profile={profile} links={links} />;
    case 'glass':
      return <GlassBioTemplate profile={profile} links={links} />;
    case 'industrial':
      return <IndustrialBioTemplate profile={profile} links={links} />;
    case 'retro':
      return <RetroPopBioTemplate profile={profile} links={links} />;
    case 'cyberpunk':
      return <CyberpunkBioTemplate profile={profile} links={links} />;
    case 'neubrutalism':
      return <NeubrutalismBioTemplate profile={profile} links={links} />;
    case 'lofi':
      return <LofiBioTemplate profile={profile} links={links} />;
    case 'clay':
      return <ClaymorphismBioTemplate profile={profile} links={links} />;
    case 'bauhaus':
      return <BauhausBioTemplate profile={profile} links={links} />;
    case 'lab':
      return <LabBioTemplate profile={profile} links={links} />;
    case 'archive':
      return <ArchiveBioTemplate profile={profile} links={links} />;
    default:
      // Fallback to Vibrant for legacy themes or defaults
      return <VibrantBioTemplate profile={profile} links={links} />;
  }
};

export default BioView;