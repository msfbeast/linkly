import React, { useEffect, useState } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
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
import AskMyAI from '../components/AskMyAI';

import { useParams } from 'react-router-dom';

interface BioViewProps {
  handle?: string;
}

const BioView: React.FC<BioViewProps> = ({ handle: propHandle }) => {
  const { handle: paramHandle } = useParams<{ handle: string }>();
  const handle = propHandle || paramHandle || '';

  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!handle) return;
      setLoading(true);
      try {
        const foundProfile = await supabaseAdapter.getBioProfileByHandle(handle);
        if (foundProfile) {
          setProfile(foundProfile);
          if (foundProfile.links && foundProfile.links.length > 0) {
            const profileLinks = await supabaseAdapter.getPublicLinks(foundProfile.links);
            setLinks(profileLinks);
          } else {
            setLinks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [handle]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-500">
        Profile not found
      </div>
    );
  }

  let content;

  // Render Custom Template if configured
  if (profile.customTheme) {
    content = <CustomBioTemplate profile={profile} links={links} />;
  } else {
    // Render the selected template
    switch (profile.theme) {
      case 'vibrant':
        content = <VibrantBioTemplate profile={profile} links={links} />;
        break;
      case 'glass':
        content = <GlassBioTemplate profile={profile} links={links} />;
        break;
      case 'industrial':
        content = <IndustrialBioTemplate profile={profile} links={links} />;
        break;
      case 'retro':
        content = <RetroPopBioTemplate profile={profile} links={links} />;
        break;
      case 'cyberpunk':
        content = <CyberpunkBioTemplate profile={profile} links={links} />;
        break;
      case 'neubrutalism':
        content = <NeubrutalismBioTemplate profile={profile} links={links} />;
        break;
      case 'lofi':
        content = <LofiBioTemplate profile={profile} links={links} />;
        break;
      case 'clay':
        content = <ClaymorphismBioTemplate profile={profile} links={links} />;
        break;
      case 'bauhaus':
        content = <BauhausBioTemplate profile={profile} links={links} />;
        break;
      case 'lab':
        content = <LabBioTemplate profile={profile} links={links} />;
        break;
      case 'archive':
        content = <ArchiveBioTemplate profile={profile} links={links} />;
        break;
      default:
        // Fallback to Vibrant for legacy themes or defaults
        content = <VibrantBioTemplate profile={profile} links={links} />;
    }
  }

  return (
    <>
      {content}
      <AskMyAI profile={profile} links={links} />
    </>
  );
};

export default BioView;