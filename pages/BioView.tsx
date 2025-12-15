import React, { useEffect, useState } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { BioProfile, LinkData, Product } from '../types';
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
import BentoBioTemplate from '../components/bio-templates/BentoBioTemplate';
import NeoPopBioTemplate from '../components/bio-templates/NeoPopBioTemplate';
import EditorialBioTemplate from '../components/bio-templates/EditorialBioTemplate';
import SwissBioTemplate from '../components/bio-templates/SwissBioTemplate';
import MidnightBioTemplate from '../components/bio-templates/MidnightBioTemplate';
import NatureBioTemplate from '../components/bio-templates/NatureBioTemplate';
import AuraBioTemplate from '../components/bio-templates/AuraBioTemplate';
import PixelBioTemplate from '../components/bio-templates/PixelBioTemplate';
import TerminalBioTemplate from '../components/bio-templates/TerminalBioTemplate';
import PaperBioTemplate from '../components/bio-templates/PaperBioTemplate';
import LuxuryBioTemplate from '../components/bio-templates/LuxuryBioTemplate';
import GamerBioTemplate from '../components/bio-templates/GamerBioTemplate';
import AirBioTemplate from '../components/bio-templates/AirBioTemplate';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'store'>('links');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!handle) return;
      setLoading(true);
      try {
        const foundProfile = await supabaseAdapter.getBioProfileByHandle(handle);
        if (foundProfile) {
          setProfile(foundProfile);

          // Fetch Links
          if (foundProfile.links && foundProfile.links.length > 0) {
            const profileLinks = await supabaseAdapter.getPublicLinks(foundProfile.links);
            setLinks(profileLinks);
          } else {
            setLinks([]);
          }

          // Fetch Products (if any)
          const userProducts = await supabaseAdapter.getProducts(foundProfile.userId);
          setProducts(userProducts);
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

  // Floating Tab Switcher - Only show if there are products
  const TabSwitcher = products.length > 0 && (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideUpFade">
      <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-full ring-1 ring-black/5">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'links'
            ? 'bg-slate-900 text-white shadow-lg'
            : 'text-stone-500 hover:text-slate-900 hover:bg-stone-100'
            }`}
        >
          Links
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'store'
            ? 'bg-slate-900 text-white shadow-lg'
            : 'text-stone-500 hover:text-slate-900 hover:bg-stone-100'
            }`}
        >
          Store
          <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] rounded-full">
            {products.length}
          </span>
        </button>
      </div>
    </div>
  );

  let content;
  const commonProps = { profile, links, products, activeTab };

  // Render Custom Template if configured
  if (profile.customTheme) {
    content = <CustomBioTemplate {...commonProps} />;
  } else {
    // Render the selected template
    switch (profile.theme) {
      case 'vibrant':
        content = <VibrantBioTemplate {...commonProps} />;
        break;
      case 'glass':
        content = <GlassBioTemplate {...commonProps} />;
        break;
      case 'industrial':
        content = <IndustrialBioTemplate {...commonProps} />;
        break;
      case 'retro':
        content = <RetroPopBioTemplate {...commonProps} />;
        break;
      case 'cyberpunk':
        content = <CyberpunkBioTemplate {...commonProps} />;
        break;
      case 'neubrutalism':
        content = <NeubrutalismBioTemplate {...commonProps} />;
        break;
      case 'lofi':
        content = <LofiBioTemplate {...commonProps} />;
        break;
      case 'clay':
        content = <ClaymorphismBioTemplate {...commonProps} />;
        break;
      case 'bauhaus':
        content = <BauhausBioTemplate {...commonProps} />;
        break;
      case 'lab':
        content = <LabBioTemplate {...commonProps} />;
        break;
      case 'archive':
        content = <ArchiveBioTemplate {...commonProps} />;
        break;
      case 'bento':
        content = <BentoBioTemplate {...commonProps} />;
        break;
      case 'neopop':
        content = <NeoPopBioTemplate {...commonProps} />;
        break;
      case 'editorial':
        content = <EditorialBioTemplate {...commonProps} />;
        break;
      case 'swiss':
        content = <SwissBioTemplate {...commonProps} />;
        break;
      case 'midnight':
        content = <MidnightBioTemplate {...commonProps} />;
        break;
      case 'nature':
        content = <NatureBioTemplate {...commonProps} />;
        break;
      case 'aura':
        content = <AuraBioTemplate {...commonProps} />;
        break;
      case 'pixel':
        content = <PixelBioTemplate {...commonProps} />;
        break;
      case 'terminal':
        content = <TerminalBioTemplate {...commonProps} />;
        break;
      case 'paper':
        content = <PaperBioTemplate {...commonProps} />;
        break;
      case 'luxury':
        content = <LuxuryBioTemplate {...commonProps} />;
        break;
      case 'gamer':
        content = <GamerBioTemplate {...commonProps} />;
        break;
      case 'air':
        content = <AirBioTemplate {...commonProps} />;
        break;
      default:
        // Fallback to Vibrant for legacy themes or defaults
        content = <VibrantBioTemplate {...commonProps} />;
    }
  }

  return (
    <>
      {content}
      {TabSwitcher}
      <AskMyAI profile={profile} links={links} />
    </>
  );
};

export default BioView;