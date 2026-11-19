
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Link as LinkIcon, Loader2, Wand2, Smartphone, Globe, Layers, Trash, Lock, ChevronDown, ChevronUp, Split, Calendar, Tag, AlertCircle, Upload, Image as ImageIcon, Trash2, Sliders, Info, RefreshCw, Check, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import UTMBuilderModal from './UTMBuilderModal';
import { analyzeUrlWithGemini, GeminiAnalysisResult, generateLinkMetadata } from '../services/geminiService';
import { monetizeUrl, isShortAmazonUrl, resolveShortUrl } from '../utils/affiliateUtils';
import { LinkData, SmartRedirects, Folder, Domain, LinkType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TagInput } from './TagInput';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import InfoTooltip from './InfoTooltip';
import { COUNTRY_NAMES } from '../utils/constants';
import exifr from 'exifr';
import { extractDriveFolderId, fetchDriveFolderImages } from '../services/googleDriveService';
import { FEATURES } from '../utils/featureFlags';
import { newShortCode } from '../utils/shortCode';

/** Most links one bulk paste creates. */
export const MAX_BULK_LINKS = 50;
const SAMPLE_CSV = 'url,slug,title,tags\nhttps://www.amazon.in/dp/B0EXAMPLE,earbuds,Best earbuds under 2000,deals|audio\nhttps://example.com/article,,My article,\n';
const SAMPLE_CSV_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`;

/** The address people see and share, without the protocol. */
export function shortLinkLabel(link: Pick<LinkData, 'domain' | 'shortCode'>, origin = window.location.origin): string {
  const domain = link.domain || 'links.trak.in';
  return domain === 'links.trak.in' ? `${origin.replace(/^https?:\/\//, '')}/r/${link.shortCode}` : `${domain}/${link.shortCode}`;
}

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (link: LinkData) => Promise<void>;
  onUpdate: (id: string, link: Partial<LinkData>) => Promise<void>;
  onBulkCreate: (links: LinkData[]) => Promise<void>;
  editingLink?: LinkData | null;
}

const SuccessView: React.FC<{ links: LinkData[]; onClose: () => void }> = ({ links, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getFullShortUrl = (link: LinkData) => {
    const domain = link.domain || 'links.trak.in';
    return domain === 'links.trak.in'
      ? `${window.location.origin}/r/${link.shortCode}`
      : `https://${domain}/${link.shortCode}`;
  };

  const handleCopy = (link: LinkData, index: number) => {
    navigator.clipboard.writeText(getFullShortUrl(link));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isSingle = links.length === 1;

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5A14] text-white">
        <Check className="h-6 w-6" />
      </div>
      <h3 className="text-[22px] font-medium tracking-tight text-[#18181A]">
        {isSingle ? 'Link ready' : `${links.length} links ready`}
      </h3>
      <p className="mt-1 text-[13px] text-[#8C8981]">
        {isSingle ? 'Copied to your clipboard.' : 'The first one is copied to your clipboard.'}
      </p>

      <div className="mt-6 w-full max-w-md text-left">
        {isSingle ? (
          <>
            <div className="flex items-center gap-2 rounded-2xl bg-[#18181A] py-2 pl-4 pr-2 text-white">
              <span className="min-w-0 flex-1 truncate font-mono text-[14px]">{shortLinkLabel(links[0])}</span>
              <button
                onClick={() => handleCopy(links[0], 0)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium ${copiedIndex === 0 ? 'bg-[#FF5A14] text-white' : 'bg-[#2A2A2D] text-[#F2F1EE] hover:bg-[#333336]'}`}
              >
                {copiedIndex === 0 ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
            <p className="mt-2 truncate px-1 font-mono text-[11px] text-[#A19E97]">→ {links[0].originalUrl}</p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <div className="rounded-2xl bg-white p-3">
                <QRCodeCanvas value={getFullShortUrl(links[0])} size={132} level="H" bgColor="#ffffff" fgColor="#18181A" />
              </div>
              <span className="text-[11px] text-[#A19E97]">Scan to open on a phone</span>
            </div>
          </>
        ) : (
          <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-1">
            {links.map((link, idx) => (
              <div key={link.id} className="flex items-center gap-3 rounded-xl bg-[#F3F2EF] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12px] text-[#18181A]">{shortLinkLabel(link)}</div>
                  <p className="mt-0.5 truncate text-[11px] text-[#A19E97]">{link.originalUrl}</p>
                </div>
                <button
                  onClick={() => handleCopy(link, idx)}
                  aria-label={`Copy ${shortLinkLabel(link)}`}
                  className={`shrink-0 rounded-full p-2 ${copiedIndex === idx ? 'bg-[#FF5A14] text-white' : 'text-[#8C8981] hover:bg-[#E6E3DD] hover:text-[#18181A]'}`}
                >
                  {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onClose} className="mt-6 w-full max-w-md rounded-full bg-[#18181A] py-3 text-[14px] font-medium text-white hover:opacity-90">
        Done
      </button>
    </div>
  );
};

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ isOpen, onClose, onCreate, onUpdate, onBulkCreate, editingLink }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'single' | 'bulk' | 'csv'>('single');

  // Single Mode States
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState(''); // Added title state
  const [description, setDescription] = useState(''); // Added description state
  const [linkType, setLinkType] = useState<LinkType>('link');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [beforeAfter, setBeforeAfter] = useState<{ beforeUrl: string; afterUrl: string; beforeLabel: string; afterLabel: string }>({
    beforeUrl: '',
    afterUrl: '',
    beforeLabel: 'Standard HDR',
    afterLabel: 'Raw Recovery'
  });
  const [creatorProduct, setCreatorProduct] = useState<{ title: string; description: string; price: string; buttonText: string; buttonUrl: string; imageUrl: string }>({
    title: '',
    description: '',
    price: '',
    buttonText: 'Get Preset Pack',
    buttonUrl: '',
    imageUrl: ''
  });
  const [sponsor, setSponsor] = useState<{ title: string; description: string; buttonText: string; buttonUrl: string }>({
    title: '',
    description: '',
    buttonText: 'Buy Now',
    buttonUrl: ''
  });
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // Added for title generation
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]); // This state will hold fetched Domain objects
  const [selectedDomain, setSelectedDomain] = useState('links.trak.in'); // Initial default domain

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdLinksSuccess, setCreatedLinksSuccess] = useState<LinkData[]>([]);

  // Bulk Mode States
  const [bulkUrls, setBulkUrls] = useState('');

  // CSV Mode States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smartRedirects, setSmartRedirects] = useState<SmartRedirects>({ ios: '', android: '', desktop: '' });
  const [geoRedirects, setGeoRedirects] = useState<{ country: string, url: string }[]>([]);
  const [showUTMBuilder, setShowUTMBuilder] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [clickLimit, setClickLimit] = useState('');
  const [clickGoal, setClickGoal] = useState('');
  const [password, setPassword] = useState('');

  // A/B Testing State
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [variants, setVariants] = useState<{ id: string; url: string; weight: number }[]>([]);

  useEffect(() => {
    if (editingLink) {
      setMode('single');
      setUrl(editingLink.originalUrl);
      setSlug(editingLink.shortCode);
      setTitle(editingLink.title || ''); // Set title for editing
      setDescription(editingLink.description || ''); // Set description for editing
      setLinkType(editingLink.type || 'link');
      if (editingLink.type === 'gallery' && editingLink.metadata) {
        setGalleryItems(editingLink.metadata.galleryItems || []);
        setBeforeAfter(editingLink.metadata.beforeAfter || {
          beforeUrl: '',
          afterUrl: '',
          beforeLabel: 'Standard HDR',
          afterLabel: 'Raw Recovery'
        });
        setCreatorProduct(editingLink.metadata.creatorProduct || {
          title: '',
          description: '',
          price: '',
          buttonText: 'Get Preset Pack',
          buttonUrl: '',
          imageUrl: ''
        });
        setSponsor(editingLink.metadata.sponsor || {
          title: '',
          description: '',
          buttonText: 'Buy Now',
          buttonUrl: ''
        });
      } else {
        setGalleryItems([]);
        setBeforeAfter({ beforeUrl: '', afterUrl: '', beforeLabel: 'Standard HDR', afterLabel: 'Raw Recovery' });
        setCreatorProduct({ title: '', description: '', price: '', buttonText: 'Get Preset Pack', buttonUrl: '', imageUrl: '' });
        setSponsor({ title: '', description: '', buttonText: 'Buy Now', buttonUrl: '' });
      }

      setSmartRedirects({
        ios: editingLink.smartRedirects?.ios || '',
        android: editingLink.smartRedirects?.android || '',
        desktop: editingLink.smartRedirects?.desktop || '',
      });

      const geoArray = editingLink.geoRedirects
        ? Object.entries(editingLink.geoRedirects).map(([k, v]) => ({ country: k, url: v as string }))
        : [];
      setGeoRedirects(geoArray);

      setStartDate(editingLink.startDate ? new Date(editingLink.startDate).toISOString().slice(0, 16) : '');
      setExpirationDate(editingLink.expirationDate ? new Date(editingLink.expirationDate).toISOString().slice(0, 16) : '');
      setClickLimit(editingLink.maxClicks ? editingLink.maxClicks.toString() : '');
      setPassword(editingLink.password || '');

      if (editingLink.smartRedirects?.ios || editingLink.smartRedirects?.android || geoArray.length > 0 || editingLink.expirationDate || editingLink.maxClicks || editingLink.password) {
        setShowAdvanced(true);
      }
      setTags(editingLink.tags || []);
      setFolderId(editingLink.folderId || null);
      setSelectedDomain(editingLink.domain || 'links.trak.in');

      if (editingLink.abTestConfig) {
        setAbTestEnabled(editingLink.abTestConfig.enabled);
        setVariants(editingLink.abTestConfig.variants);
        if (editingLink.abTestConfig.enabled) setShowAdvanced(true);
      }
    }
  }, [editingLink, isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [loadedFolders, loadedDomains] = await Promise.all([
        supabaseAdapter.getFolders(user.id),
        supabaseAdapter.getDomains(user.id)
      ]);
      setFolders(loadedFolders);
      setDomains(loadedDomains.filter(d => d.status === 'active'));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeUrlWithGemini(url);
      setAnalysis(result);
      if (!slug && !editingLink) setSlug(result.suggestedSlug || '');
      if (!title && !editingLink) setTitle(result.title || 'Untitled Link');
      if (!description && !editingLink) setDescription(result.description || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddGeoRule = () => {
    setGeoRedirects([...geoRedirects, { country: '', url: '' }]);
  };

  const updateGeoRule = (index: number, field: 'country' | 'url', value: string) => {
    const newRules = [...geoRedirects];
    newRules[index] = { ...newRules[index], [field]: value };
    setGeoRedirects(newRules);
  };

  const removeGeoRule = (index: number) => {
    setGeoRedirects(geoRedirects.filter((_, i) => i !== index));
  };

  const handleDriveFolderSync = async () => {
    if (!url) {
      setGalleryError('Please enter a Google Drive folder URL in the Destination input first.');
      return;
    }
    const folderId = extractDriveFolderId(url);
    if (!folderId) {
      setGalleryError('Invalid Google Drive URL. Please make sure it points to a Google Drive folder (e.g., https://drive.google.com/drive/folders/...).');
      return;
    }

    setSyncingDrive(true);
    setGalleryError(null);

    try {
      const items = await fetchDriveFolderImages(folderId);
      if (items.length === 0) {
        setGalleryError('No images found in this folder. Make sure the folder is shared publicly (Anyone with the link can view) and contains image files.');
      } else {
        setGalleryItems(items);
        if (items.length >= 2) {
          setBeforeAfter({
            beforeUrl: items[0].url,
            afterUrl: items[1].url,
            beforeLabel: 'Standard HDR',
            afterLabel: 'Raw Recovery'
          });
        }
      }
    } catch (err: any) {
      console.error('Google Drive Sync failed:', err);
      setGalleryError(err.message || 'Failed to sync with Google Drive. Please make sure the folder is public and your API key is correct.');
    } finally {
      setSyncingDrive(false);
    }
  };

  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !user?.id) return;
    setUploadingGallery(true);
    setGalleryError(null);

    const files = Array.from(e.target.files);
    const newItems = [...galleryItems];

    for (const file of files) {
      try {
        let exifData: any = {};
        try {
          const output = await exifr.parse(file, {
            tiff: true,
            exif: true,
            gps: false,
          });

          if (output) {
            let exposureStr = '';
            if (output.ExposureTime) {
              const exp = output.ExposureTime;
              if (exp < 1) {
                exposureStr = `1/${Math.round(1 / exp)}s`;
              } else {
                exposureStr = `${exp}s`;
              }
            }
            exifData = {
              make: output.Make || '',
              model: output.Model || '',
              iso: output.ISO ? String(output.ISO) : '',
              fNumber: output.FNumber ? `f/${output.FNumber}` : '',
              exposureTime: exposureStr || (output.ExposureTime ? String(output.ExposureTime) : ''),
              focalLength: output.FocalLength ? `${output.FocalLength}mm` : '',
              lensModel: output.LensModel || '',
              createDate: output.CreateDate || '',
            };
          }
        } catch (exifErr) {
          console.warn('Failed to parse EXIF:', exifErr);
        }

        const publicUrl = await supabaseAdapter.uploadGalleryImage(file, user.id);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        newItems.push({
          id: uuidv4(),
          title: file.name.split('.')[0],
          category: newItems.length === 0 ? 'Main (1x)' : newItems.length === 1 ? 'Telephoto (3.7x)' : 'Night (1x)',
          description: '',
          url: publicUrl,
          camera: exifData.model || exifData.make || 'Custom Camera',
          sensor: exifData.lensModel || 'Standard Sensor',
          aperture: exifData.fNumber || 'f/1.8',
          iso: exifData.iso || '100',
          shutter: exifData.exposureTime || '1/120s',
          size: `${sizeMb} (RAW)`
        });
      } catch (err) {
        console.error('Error uploading gallery image:', err);
        setGalleryError('Failed to upload some images. Please try again.');
      }
    }

    setGalleryItems(newItems);
    setUploadingGallery(false);
  };

  const handleDeleteGalleryItem = (id: string) => {
    setGalleryItems(galleryItems.filter(item => item.id !== id));
  };

  const handleUpdateGalleryItem = (id: string, field: string, value: any) => {
    setGalleryItems(galleryItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    // No code typed: pick a random one, like bulk and CSV links get.
    const code = slug.trim() || (editingLink ? editingLink.shortCode : newShortCode());
    setIsSubmitting(true);
    setSubmitError(null);

    const geoRecord: Record<string, string> = {};
    geoRedirects.forEach(rule => {
      if (rule.country && rule.url) {
        geoRecord[rule.country.toUpperCase()] = rule.url;
      }
    });

    let urlToMonetize = url.trim();
    if (isShortAmazonUrl(urlToMonetize)) {
      urlToMonetize = await resolveShortUrl(urlToMonetize);
    }

    const cleanUrl = monetizeUrl(urlToMonetize, {
      amazonAssociateTag: user?.amazonAssociateTag,
      flipkartAffiliateId: user?.flipkartAffiliateId
    });

    const commonData = {
      originalUrl: cleanUrl,
      shortCode: code,
      title: title || cleanUrl,
      description: description,
      type: linkType,
      metadata: linkType === 'gallery' ? {
        galleryItems,
        beforeAfter,
        creatorProduct,
        sponsor
      } : undefined,
      smartRedirects: {
        ios: smartRedirects.ios || undefined,
        android: smartRedirects.android || undefined,
        desktop: smartRedirects.desktop || undefined
      },
      geoRedirects: Object.keys(geoRecord).length > 0 ? geoRecord : undefined,
      startDate: startDate ? new Date(startDate).getTime() : null,
      expirationDate: expirationDate ? new Date(expirationDate).getTime() : null,
      maxClicks: clickLimit ? parseInt(clickLimit) : null,
      clickGoal: clickGoal ? parseInt(clickGoal) : null,
      password: password || null,
      tags: tags,
      folderId: folderId,
      abTestConfig: abTestEnabled ? {
        enabled: true,
        variants: variants
      } : undefined,
      domain: selectedDomain !== 'links.trak.in' ? selectedDomain : undefined
    };

    try {
      if (editingLink) {
        await onUpdate(editingLink.id, {
          ...commonData,
          tags: tags.length > 0 ? tags : (analysis?.tags || editingLink.tags),
          aiAnalysis: analysis ? {
            sentiment: analysis.sentiment,
            category: analysis.category,
            predictedEngagement: analysis.predictedEngagement
          } : editingLink.aiAnalysis
        });
        resetAndClose();
      } else {
        const newLink: LinkData = {
          id: uuidv4(),
          ...commonData,
          tags: tags.length > 0 ? tags : (analysis?.tags || []),
          clicks: 0,
          clickHistory: [],
          createdAt: Date.now(),
          aiAnalysis: analysis ? {
            sentiment: analysis.sentiment,
            category: analysis.category,
            predictedEngagement: analysis.predictedEngagement
          } : undefined
        };
        await onCreate(newLink);
        
        // Show success screen and auto-copy link
        setCreatedLinksSuccess([newLink]);
        const domain = newLink.domain || 'links.trak.in';
        const fullShortUrl = domain === 'links.trak.in'
          ? `${window.location.origin}/r/${newLink.shortCode}`
          : `https://${domain}/${newLink.shortCode}`;
        navigator.clipboard.writeText(fullShortUrl).catch(err => {
          console.warn('Failed to auto-copy short link:', err);
        });
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to create link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    const urls = bulkUrls.split('\n').filter(u => u.trim().length > 0);
    if (urls.length > MAX_BULK_LINKS) {
      setSubmitError(`Paste up to ${MAX_BULK_LINKS} links at a time; this has ${urls.length}.`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newLinks: LinkData[] = await Promise.all(
        urls.map(async u => {
          let urlToMonetize = u.trim();
          if (!/^https?:\/\//i.test(urlToMonetize)) {
            urlToMonetize = `https://${urlToMonetize}`;
          }
          if (isShortAmazonUrl(urlToMonetize)) {
            urlToMonetize = await resolveShortUrl(urlToMonetize);
          }
          const cleanUrl = monetizeUrl(urlToMonetize, {
            amazonAssociateTag: user?.amazonAssociateTag,
            flipkartAffiliateId: user?.flipkartAffiliateId
          });
          return {
            id: uuidv4(),
            originalUrl: cleanUrl,
            shortCode: newShortCode(),
            title: u.trim(),
            description: 'Bulk created link',
            tags: ['bulk'],
            clicks: 0,
            clickHistory: [],
            createdAt: Date.now(),
            smartRedirects: {},
            aiAnalysis: undefined,
            domain: selectedDomain !== 'links.trak.in' ? selectedDomain : undefined
          };
        })
      );

      await onBulkCreate(newLinks);
      
      // Show success screen and auto-copy first link
      setCreatedLinksSuccess(newLinks);
      if (newLinks.length > 0) {
        const domain = newLinks[0].domain || 'links.trak.in';
        const firstUrl = domain === 'links.trak.in'
          ? `${window.location.origin}/r/${newLinks[0].shortCode}`
          : `https://${domain}/${newLinks[0].shortCode}`;
        navigator.clipboard.writeText(firstUrl).catch(err => {
          console.warn('Failed to auto-copy first short link:', err);
        });
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to create bulk links');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !user) return;

    setIsProcessingCsv(true);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

        // Basic Validation
        const urlIndex = headers.findIndex(h => h === 'url' || h === 'destination' || h === 'originalurl');
        if (urlIndex === -1) {
          throw new Error('CSV must contain a "url" or "destination" column.');
        }

        const linksToCreate: LinkData[] = [];

        // Parse rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Handle simple CSV splitting (doesn't support commas in quotes yet)
          const values = line.split(',').map(v => v.trim());
          const url = values[urlIndex];

          if (!url) continue;

          const slugIndex = headers.indexOf('slug');
          const titleIndex = headers.indexOf('title');
          const tagsIndex = headers.indexOf('tags');

          const slug = slugIndex !== -1 ? values[slugIndex] : undefined;
          const title = titleIndex !== -1 ? values[titleIndex] : 'Untitled Link';
          const tags = tagsIndex !== -1 ? values[tagsIndex]?.split('|') : [];

          // Clean and Monetize
          let rawUrl = url.startsWith('http') ? url : `https://${url}`;
          if (isShortAmazonUrl(rawUrl)) {
            rawUrl = await resolveShortUrl(rawUrl);
          }
          const cleanUrl = monetizeUrl(rawUrl, {
            amazonAssociateTag: user?.amazonAssociateTag,
            flipkartAffiliateId: user?.flipkartAffiliateId
          });

          linksToCreate.push({
            id: uuidv4(),
            userId: user.id, // Inject User ID
            originalUrl: cleanUrl,
            shortCode: slug || newShortCode(),
            title: title,
            tags: tags,
            clicks: 0,
            clickHistory: [],
            createdAt: Date.now(),
            domain: selectedDomain !== 'links.trak.in' ? selectedDomain : undefined
          });
        }

        if (linksToCreate.length === 0) {
          throw new Error('No valid links found in CSV.');
        }

        await onBulkCreate(linksToCreate);

        // Show success screen and auto-copy first link
        setCreatedLinksSuccess(linksToCreate);
        if (linksToCreate.length > 0) {
          const domain = linksToCreate[0].domain || 'links.trak.in';
          const firstUrl = domain === 'links.trak.in'
            ? `${window.location.origin}/r/${linksToCreate[0].shortCode}`
            : `https://${domain}/${linksToCreate[0].shortCode}`;
          navigator.clipboard.writeText(firstUrl).catch(err => {
            console.warn('Failed to auto-copy first short link:', err);
          });
        }

      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV');
      } finally {
        setIsProcessingCsv(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setUrl('');
      setSlug('');
      setTitle(''); // Reset title
      setDescription(''); // Reset description
      setLinkType('link');
      setGalleryItems([]);
      setBeforeAfter({ beforeUrl: '', afterUrl: '', beforeLabel: 'Standard HDR', afterLabel: 'Raw Recovery' });
      setCreatorProduct({ title: '', description: '', price: '', buttonText: 'Get Preset Pack', buttonUrl: '', imageUrl: '' });
      setSponsor({ title: '', description: '', buttonText: 'Buy Now', buttonUrl: '' });
      setGalleryError(null);
      setAnalysis(null);
      setBulkUrls('');
      setSmartRedirects({ ios: '', android: '', desktop: '' });
      setGeoRedirects([]);
      setStartDate('');
      setExpirationDate('');
      setClickLimit('');
      setClickGoal('');
      setPassword('');
      setTags([]);
      setFolderId(null);
      setSelectedDomain('links.trak.in');
      setAbTestEnabled(false);
      setVariants([]);
      setMode('single');
      setShowAdvanced(false);
      setIsSubmitting(false);
      setSubmitError(null);
      setCreatedLinksSuccess([]);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" >
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#18181A]/50 backdrop-blur-sm transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative flex h-[90vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-t-3xl bg-[#FBFAF8] text-left text-[#18181A] shadow-2xl transition-all sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
        >
          {createdLinksSuccess.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
              <SuccessView links={createdLinksSuccess} onClose={resetAndClose} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between bg-[#FBFAF8] px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
                <div>
                  <h3 className="text-[22px] font-medium tracking-tight">{editingLink ? 'Edit link' : 'New link'}</h3>
                  <p className="text-[12px] text-[#8C8981]">
                    {editingLink ? `/${editingLink.shortCode}` : mode === 'single' ? 'Paste a long address, get a short one.' : mode === 'bulk' ? `Up to ${MAX_BULK_LINKS} addresses, one per line.` : 'Upload a CSV of addresses.'}
                  </p>
                </div>
                <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-[#8C8981] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-6 pt-3 sm:px-7">
                {submitError && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-[#FDECEA] p-4 text-[13px] text-[#B42318]">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}

            {/* Tabs - Only show in Create Mode */}
            {!editingLink && (
              <div role="group" aria-label="How many links" className="flex gap-1 rounded-full bg-[#F0EEEA] p-1">
                {([['single', 'One link'], ['bulk', 'Many links'], ['csv', 'CSV file']] as const).map(([m, name]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`flex-1 rounded-full py-2 text-[13px] transition-colors ${mode === m ? 'bg-[#18181A] text-white' : 'text-[#8C8981] hover:text-[#18181A]'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {mode === 'single' ? (
              <>
                {/* Link Type Selector */}
                {/* Gallery links can't be made any more; existing ones can still be edited or turned into redirects. */}
                {editingLink?.type === 'gallery' && (<div className="mb-6">
                  <label className="mb-1.5 block text-[12px] text-[#8C8981]">Link Type</label>
                  <div className="flex gap-1 rounded-full bg-[#F0EEEA] p-1">
                    <button
                      type="button"
                      onClick={() => setLinkType('link')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        linkType === 'link'
                          ? 'bg-[#18181A] text-white'
                          : 'text-[#8C8981] hover:text-[#18181A]'
                      }`}
                    >
                      🔗 Redirect Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkType('gallery')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        linkType === 'gallery'
                          ? 'bg-[#18181A] text-white'
                          : 'text-[#8C8981] hover:text-[#18181A]'
                      }`}
                    >
                      🖼️ Media Gallery
                    </button>
                  </div>
                </div>)}

                {/* URL Input */}
                <div className="mb-8">
                  <label className="mb-1.5 block text-[12px] text-[#8C8981]">
                    {linkType === 'gallery' ? 'Original RAW Folder URL (e.g. Google Drive)' : 'Destination URL'}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder={linkType === 'gallery' ? 'https://drive.google.com/drive/folders/...' : 'https://example.com/my-long-url'}
                        className="w-full bg-[#F0EEEA] border border-transparent text-[#18181A] p-4 rounded-2xl pl-12 focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all shadow-sm"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                      />
                      <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A19E97]" />
                      <button
                        type="button"
                        onClick={() => setShowUTMBuilder(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#8C8981] hover:text-[#FF5A14] hover:bg-[#FBFAF8] rounded-lg transition-colors"
                        title="UTM Builder"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={!url || isAnalyzing}
                      className="flex min-h-[44px] min-w-[132px] items-center justify-center gap-2 self-stretch rounded-2xl bg-[#18181A] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Fill in the title, description and a short code from the page"
                    >
                      {/* Button content */}
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 text-[#FF9B6A]" /> Fill with AI</>}
                    </button>
                  </div>
                </div>

                {/* AI Analysis Result */}
                {analysis && (
                  <div className="relative mb-6 overflow-hidden rounded-2xl bg-[#F3F2EF] p-5">
                    <div className="mb-2 flex items-center gap-2 text-[12px] text-[#8C8981]">
                      <Wand2 className="w-4 h-4" />
                      <span>Filled in from the page</span>
                    </div>
                    <h3 className="mb-1 text-[16px] font-medium">{analysis.title}</h3>
                    <p className="text-[13px] leading-relaxed text-[#5F5C56]">{analysis.description}</p>

                    <div className="mt-3 flex gap-1.5">
                      {(analysis.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-md bg-[#FBFAF8] px-2 py-0.5 font-mono text-[11px] text-[#8C8981]">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSingleSubmit}>
                  <div className="mb-8">
                    <label htmlFor="link-slug" className="mb-1.5 block text-[12px] text-[#8C8981]">Short code <span className="text-[#A19E97]">· optional, random if empty</span></label>
                    <div className="flex items-center bg-[#F0EEEA] rounded-2xl px-0 py-0 focus-within:ring-2 focus-within:ring-[#FF5A14]/30 transition-all overflow-hidden relative">
                      {domains.length > 0 ? (
                        <div className="relative border-r border-[#E2DFD8] h-full flex items-center">
                          <select
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            className="h-full cursor-pointer appearance-none bg-transparent py-3 pl-4 pr-8 font-mono text-sm text-[#5F5C56] focus:outline-none"
                          >
                            <option value="links.trak.in">links.trak.in</option>
                            {domains.map(d => (
                              <option key={d.id} value={d.domain}>{d.domain}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#A19E97]" />
                        </div>
                      ) : (
                        <span className="border-r border-[#E2DFD8] py-3 pl-4 pr-3 font-mono text-sm text-[#8C8981]">links.trak.in</span>
                      )}

                      <span className="select-none py-3 pl-2 font-mono text-sm text-[#A19E97]">{selectedDomain === 'links.trak.in' ? '/r/' : '/'}</span>

                      <input
                        type="text"
                        id="link-slug"
                        placeholder={editingLink ? editingLink.shortCode : 'random'}
                        className="w-full border-none bg-transparent p-2.5 font-mono text-sm text-[#18181A] placeholder:text-[#A19E97] focus:outline-none focus:ring-0"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="mb-1.5 block text-[12px] text-[#8C8981]">Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="My Awesome Link"
                          className="w-full bg-[#F0EEEA] border border-transparent text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all font-medium pr-10"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!url) return;
                            setIsGeneratingTitle(true);
                            const metadata = await generateLinkMetadata(url, title);
                            setTitle(metadata.title);
                            setDescription(metadata.description);
                            setIsGeneratingTitle(false);
                          }}
                          disabled={!url || isGeneratingTitle}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#FF5A14] hover:bg-[#FBFAF8] rounded-lg transition-colors disabled:opacity-50"
                          title="Magic Wand: Generate Smart Title & Summary"
                        >
                          {isGeneratingTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] text-[#8C8981]">Description</label>
                      <textarea
                        placeholder="Optional description for your link..."
                        rows={2}
                        className="w-full bg-[#F0EEEA] border border-transparent text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all text-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tags and Folder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="mb-1.5 block text-[12px] text-[#8C8981]">Tags</label>
                      <TagInput
                        userId={user?.id || ''}
                        selectedTags={tags}
                        onChange={setTags}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] text-[#8C8981]">Folder</label>
                      <select
                        value={folderId || ''}
                        onChange={(e) => setFolderId(e.target.value || null)}
                        className="w-full bg-[#F0EEEA] border border-transparent text-[#18181A] rounded-xl p-2.5 focus:outline-none focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30"
                      >
                        <option value="">No Folder</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Media Gallery Configuration */}
                  {linkType === 'gallery' && (
                    <div className="space-y-6 mb-8 p-6 bg-amber-50/30 rounded-2xl border border-amber-200/50 animate-fadeIn">
                      <div>
                        <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-amber-500" /> Gallery Photos
                        </h4>
                        <p className="text-xs text-stone-500 mb-4">
                          Select one or more images from your local device. We will automatically extract camera EXIF metadata and optimize files client-side.
                        </p>
                        
                        {galleryError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
                            <Info className="w-4 h-4 shrink-0" />
                            {galleryError}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.accept = 'image/jpeg,image/png,image/webp';
                              input.onchange = (e) => handleGalleryImagesUpload(e as any);
                              input.click();
                            }}
                            disabled={uploadingGallery || syncingDrive}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                          >
                            {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload Local Images
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleDriveFolderSync}
                            disabled={uploadingGallery || syncingDrive}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {syncingDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Sync with Google Drive
                          </button>

                          {uploadingGallery && <span className="text-xs text-stone-500 animate-pulse">Uploading and extracting EXIF...</span>}
                          {syncingDrive && <span className="text-xs text-amber-600 animate-pulse">Connecting to Drive folder...</span>}
                        </div>

                        {/* Uploaded Gallery Grid */}
                        {galleryItems.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                            {galleryItems.map((item, idx) => (
                              <div key={item.id} className="relative bg-white border border-stone-200 rounded-xl p-3 flex gap-3 group">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-50 border shrink-0">
                                  <img src={item.url} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Photo title"
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-950 focus:ring-0 focus:outline-none placeholder:text-stone-400"
                                    value={item.title || ''}
                                    onChange={(e) => handleUpdateGalleryItem(item.id, 'title', e.target.value)}
                                  />
                                  <select
                                    className="bg-stone-50 border border-stone-200 text-[10px] rounded p-1 text-stone-600 block focus:ring-0 focus:outline-none"
                                    value={item.category || 'Main (1x)'}
                                    onChange={(e) => handleUpdateGalleryItem(item.id, 'category', e.target.value)}
                                  >
                                    <option value="Main (1x)">Main (1x)</option>
                                    <option value="Telephoto (3.7x)">Telephoto (3.7x)</option>
                                    <option value="Night (1x)">Night (1x)</option>
                                    <option value="Ultrawide (0.6x)">Ultrawide (0.6x)</option>
                                  </select>
                                  <div className="text-[10px] text-stone-400 font-mono truncate">
                                    {item.camera || 'Unknown Camera'} • {item.shutter} @ ISO {item.iso}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGalleryItem(item.id)}
                                  className="absolute top-2 right-2 p-1 text-stone-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs">
                            No camera sample photos uploaded yet.
                          </div>
                        )}
                      </div>

                      {/* Before / After Configuration */}
                      <div className="border-t border-[#E2DFD8]/60 pt-4 space-y-3">
                        <h4 className="text-[13px] font-medium text-[#18181A] flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-amber-500" /> Before / After Compare Slider
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase font-bold block">Before Image URL</label>
                            <select
                              value={beforeAfter.beforeUrl}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, beforeUrl: e.target.value })}
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none"
                            >
                              <option value="">Select from Gallery</option>
                              {galleryItems.map(item => (
                                <option key={item.id} value={item.url}>{item.title}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Or paste custom image URL"
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none mt-1"
                              value={beforeAfter.beforeUrl}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, beforeUrl: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Before Label (e.g. Standard HDR)"
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none mt-1"
                              value={beforeAfter.beforeLabel}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, beforeLabel: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-stone-400 uppercase font-bold block">After Image URL</label>
                            <select
                              value={beforeAfter.afterUrl}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, afterUrl: e.target.value })}
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none"
                            >
                              <option value="">Select from Gallery</option>
                              {galleryItems.map(item => (
                                <option key={item.id} value={item.url}>{item.title}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Or paste custom image URL"
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none mt-1"
                              value={beforeAfter.afterUrl}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, afterUrl: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="After Label (e.g. Raw Recovery)"
                              className="w-full bg-white border border-stone-200 text-xs text-slate-900 p-2 rounded-xl focus:ring-0 focus:outline-none mt-1"
                              value={beforeAfter.afterLabel}
                              onChange={(e) => setBeforeAfter({ ...beforeAfter, afterLabel: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sponsor & Custom Products Ads */}
                      <div className="border-t border-[#E2DFD8]/60 pt-4 space-y-4">
                        <h4 className="text-[13px] font-medium text-[#18181A] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" /> Monetization Settings
                        </h4>

                        {/* Sponsor Banner Setup */}
                        <div className="bg-white border border-stone-200/60 rounded-xl p-4 space-y-3">
                          <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider block">Option 1: Tech Sponsor Deal</span>
                          <input
                            type="text"
                            placeholder="Sponsor Name / Phone model (e.g. Vivo X300 Ultra (5G))"
                            className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                            value={sponsor.title}
                            onChange={(e) => setSponsor({ ...sponsor, title: e.target.value })}
                          />
                          <textarea
                            placeholder="Sponsor Ad copy (e.g. Get the best launch discounts and custom skins today...)"
                            rows={2}
                            className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                            value={sponsor.description}
                            onChange={(e) => setSponsor({ ...sponsor, description: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Button Text (e.g. Buy on Amazon)"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                              value={sponsor.buttonText}
                              onChange={(e) => setSponsor({ ...sponsor, buttonText: e.target.value })}
                            />
                            <input
                              type="url"
                              placeholder="Button Affiliate URL"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                              value={sponsor.buttonUrl}
                              onChange={(e) => setSponsor({ ...sponsor, buttonUrl: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Creator Wallpaper/Preset Setup */}
                        <div className="bg-white border border-stone-200/60 rounded-xl p-4 space-y-3">
                          <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider block">Option 2: Featured Creator Product</span>
                          <input
                            type="text"
                            placeholder="Product Title (e.g. Ultra Cinematic LUTs)"
                            className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                            value={creatorProduct.title}
                            onChange={(e) => setCreatorProduct({ ...creatorProduct, title: e.target.value })}
                          />
                          <textarea
                            placeholder="Product description (e.g. 12 stylized Lightroom presets designed for vivo logs...)"
                            rows={2}
                            className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                            value={creatorProduct.description}
                            onChange={(e) => setCreatorProduct({ ...creatorProduct, description: e.target.value })}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Price (e.g. ₹299)"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none col-span-1"
                              value={creatorProduct.price}
                              onChange={(e) => setCreatorProduct({ ...creatorProduct, price: e.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Button Text"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none col-span-2"
                              value={creatorProduct.buttonText}
                              onChange={(e) => setCreatorProduct({ ...creatorProduct, buttonText: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="url"
                              placeholder="Checkout/Store URL"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                              value={creatorProduct.buttonUrl}
                              onChange={(e) => setCreatorProduct({ ...creatorProduct, buttonUrl: e.target.value })}
                            />
                            <input
                              type="url"
                              placeholder="Product Preview Image URL"
                              className="w-full bg-stone-50 border border-stone-200 text-xs text-slate-900 p-2 rounded-lg focus:ring-0 focus:outline-none"
                              value={creatorProduct.imageUrl}
                              onChange={(e) => setCreatorProduct({ ...creatorProduct, imageUrl: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-stone-400">Or choose preview from gallery:</span>
                            <select
                              value={creatorProduct.imageUrl}
                              onChange={(e) => setCreatorProduct({ ...creatorProduct, imageUrl: e.target.value })}
                              className="bg-stone-50 border border-stone-200 text-[10px] rounded p-1 text-stone-600 focus:ring-0 focus:outline-none"
                            >
                              <option value="">Select URL</option>
                              {galleryItems.map(item => (
                                <option key={item.id} value={item.url}>{item.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    aria-expanded={showAdvanced}
                    className="mb-4 flex w-full items-center justify-between rounded-2xl bg-[#F0EEEA] p-4 text-[13px] text-[#18181A] transition-colors hover:bg-[#E6E3DD]"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#FF5A14]" />
                      More options <span className="text-[#A19E97]">· device and country targets, dates, limits, password</span>
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="mb-6 space-y-6 rounded-2xl bg-[#F3F2EF] p-5">

                      {/* Device Targets */}
                      <div>
                        <h4 className="text-[13px] font-medium text-[#18181A] mb-4 flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-[#FF5A14]" /> Device Targeting
                          <InfoTooltip
                            id="device-targeting-help"
                            content="Redirect users to specific URLs based on their device (iOS, Android, or Desktop). Great for app downloads."
                          />
                        </h4>
                        <div className="space-y-3">
                          <input type="text" placeholder="iOS Destination (App Store)" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all placeholder:text-stone-400" value={smartRedirects.ios} onChange={e => setSmartRedirects({ ...smartRedirects, ios: e.target.value })} />
                          <input type="text" placeholder="Android Destination (Play Store)" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all placeholder:text-stone-400" value={smartRedirects.android} onChange={e => setSmartRedirects({ ...smartRedirects, android: e.target.value })} />
                        </div>
                      </div>

                      {/* Geo Targets */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[13px] font-medium text-[#18181A] flex items-center gap-2">
                            <Globe className="h-4 w-4 text-[#FF5A14]" /> Geo-Targeting
                            <InfoTooltip
                              id="geo-targeting-help"
                              content="Redirect users to different URLs based on their country. Useful for localized content or regional stores."
                            />
                          </h4>
                          <button type="button" onClick={handleAddGeoRule} className="rounded-full bg-[#FBFAF8] px-3 py-1.5 text-[12px] text-[#18181A] transition-colors hover:bg-white">+ Add Rule</button>
                        </div>

                        {geoRedirects.map((rule, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <select
                              className="w-[140px] bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 transition-all font-medium appearance-none cursor-pointer"
                              value={rule.country}
                              onChange={e => updateGeoRule(idx, 'country', e.target.value)}
                            >
                              <option value="">Select Country</option>
                              {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                <option key={code} value={code}>{name} ({code})</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="https://us.example.com"
                              className="flex-1 bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 placeholder:text-stone-400"
                              value={rule.url}
                              onChange={e => updateGeoRule(idx, 'url', e.target.value)}
                            />
                            <button type="button" onClick={() => removeGeoRule(idx)} className="text-stone-400 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors">
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {geoRedirects.length === 0 && (
                          <p className="text-xs text-stone-400 italic text-center py-2">No geo-rules added yet.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E2DFD8]">
                        <div>
                          <label className="mb-1.5 flex items-center gap-1 text-[12px] text-[#8C8981]">
                            <Calendar className="w-3 h-3" /> Start Date
                          </label>
                          <input type="datetime-local" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center gap-1 text-[12px] text-[#8C8981]">
                            <Calendar className="w-3 h-3" /> End Date
                          </label>
                          <input type="datetime-local" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2DFD8]">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-[12px] text-[#8C8981]">Click Limit</label>
                            <input type="number" placeholder="∞" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 placeholder:text-stone-400" value={clickLimit} onChange={e => setClickLimit(e.target.value)} />
                          </div>
                          <div>
                            <label className="mb-1.5 flex items-center gap-1 text-[12px] text-[#8C8981]">
                              🎯 Click Goal
                            </label>
                            <input type="number" placeholder="e.g. 1000" className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 placeholder:text-stone-400" value={clickGoal} onChange={e => setClickGoal(e.target.value)} />
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mt-2">Set a click goal to track progress towards your target.</p>
                      </div>

                      {/* Password Protection */}
                      <div className="pt-2 border-t border-[#E2DFD8]">
                        <label className="mb-1.5 flex items-center gap-1 text-[12px] text-[#8C8981]">
                          <Lock className="w-3 h-3" /> Password Protection
                        </label>
                        <input
                          type="text"
                          placeholder="Optional: Set a password"
                          className="w-full bg-[#FBFAF8] border border-transparent text-sm text-[#18181A] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 placeholder:text-stone-400"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                      </div>

                      {/* A/B tests are no longer offered; an existing link's test is kept as it is when saving. */}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-5">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="rounded-full px-5 py-2.5 text-[13px] text-[#8C8981] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!url || isSubmitting}
                      className="rounded-full bg-[#FF5A14] px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingLink ? 'Save changes' : 'Create link'}
                    </button>
                  </div>
                </form>
              </>
            ) : mode === 'bulk' ? (
              <div className="flex h-full flex-col">
                <div className="mb-4">
                  <label htmlFor="bulk-urls" className="mb-1.5 block text-[12px] text-[#8C8981]">Addresses, one per line</label>
                  <textarea
                    id="bulk-urls"
                    className="w-full h-64 bg-[#F0EEEA] border border-transparent text-[#18181A] rounded-xl p-4 focus:outline-none focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 font-mono text-sm leading-relaxed placeholder:text-stone-400"
                    placeholder={`https://google.com\nhttps://youtube.com\nhttps://twitter.com`}
                    value={bulkUrls}
                    onChange={e => setBulkUrls(e.target.value)}
                  />
                  <p className="mt-2 text-[12px] text-[#A19E97]">
                    Up to {MAX_BULK_LINKS} at a time. Each gets a random short code.
                  </p>
                </div>
                <div className="mt-auto flex justify-end gap-2 pt-5">
                  <button onClick={resetAndClose} className="rounded-full px-5 py-2.5 text-[13px] text-[#8C8981] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]">Cancel</button>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={!bulkUrls.trim() || isSubmitting}
                    className="rounded-full bg-[#FF5A14] px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create links
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                {/* CSV Import Mode */}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DAD7D0] bg-[#F3F2EF] p-8 text-center transition-colors hover:border-[#FF5A14]">
                  <Upload className="mb-3 h-6 w-6 text-[#FF5A14]" />
                  <span className="text-[15px] font-medium">{csvFile ? csvFile.name : 'Choose a CSV file'}</span>
                  <span className="mt-1 max-w-xs text-[12px] text-[#8C8981]">
                    Columns: <code className="font-mono">url</code>, and optionally <code className="font-mono">slug</code>, <code className="font-mono">title</code>, <code className="font-mono">tags</code> (separated by |).
                  </span>
                  <input type="file" accept=".csv" className="sr-only" onChange={(e) => { setCsvFile(e.target.files?.[0] || null); setCsvError(null); }} />
                </label>

                {csvError && (
                  <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-[#FDECEA] px-3 py-2 text-[13px] text-[#B42318]">
                    <AlertCircle className="h-4 w-4" />
                    {csvError}
                  </div>
                )}

                <p className="mt-3 text-[12px] text-[#8C8981]">
                  Not sure of the format? <a href={SAMPLE_CSV_HREF} download="gather-links-sample.csv" className="underline underline-offset-2 hover:text-[#18181A]">Download a sample</a>.
                </p>

                <div className="mt-auto flex justify-end gap-2 pt-5">
                  <button onClick={resetAndClose} className="rounded-full px-5 py-2.5 text-[13px] text-[#8C8981] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]">Cancel</button>
                  <button
                    onClick={handleCsvSubmit}
                    disabled={!csvFile || isProcessingCsv}
                    className="rounded-full bg-[#FF5A14] px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
                  >
                    {isProcessingCsv && <Loader2 className="h-4 w-4 animate-spin" />}
                    Import links
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>

        <UTMBuilderModal
          isOpen={showUTMBuilder}
          onClose={() => setShowUTMBuilder(false)}
          baseUrl={url}
          onApply={(newUrl) => setUrl(newUrl)}
        />
      </div >
    </div >
  );
};

export default CreateLinkModal;