
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Link as LinkIcon, Loader2, Wand2, Smartphone, Globe, Layers, Trash, Lock, ChevronDown, ChevronUp, Split, Calendar, Tag, AlertCircle, Calculator, Save } from 'lucide-react';
import UTMBuilderModal from './UTMBuilderModal';
import { analyzeUrlWithGemini, GeminiAnalysisResult, generateSmartTitle } from '../services/geminiService';
import { LinkData, SmartRedirects, Folder, Domain } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TagInput } from './TagInput';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import InfoTooltip from './InfoTooltip';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (link: LinkData) => void;
  onUpdate: (id: string, link: Partial<LinkData>) => void;
  onBulkCreate: (links: LinkData[]) => void;
  editingLink?: LinkData | null;
}

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ isOpen, onClose, onCreate, onUpdate, onBulkCreate, editingLink }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'single' | 'bulk' | 'csv'>('single');

  // Single Mode States
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState(''); // Added title state
  const [description, setDescription] = useState(''); // Added description state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false); // Added for title generation
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('links.trak.in');

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
      setSmartRedirects({
        ios: editingLink.smartRedirects?.ios || '',
        android: editingLink.smartRedirects?.android || '',
        desktop: editingLink.smartRedirects?.desktop || '',
      });

      const geoArray = editingLink.geoRedirects
        ? Object.entries(editingLink.geoRedirects).map(([k, v]) => ({ country: k, url: v }))
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

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !slug) return;

    const geoRecord: Record<string, string> = {};
    geoRedirects.forEach(rule => {
      if (rule.country && rule.url) {
        geoRecord[rule.country.toUpperCase()] = rule.url;
      }
    });

    const commonData = {
      originalUrl: url,
      shortCode: slug,
      title: title, // Use title from state
      description: description, // Use description from state
      smartRedirects: {
        ios: smartRedirects.ios || undefined,
        android: smartRedirects.android || undefined,
        desktop: smartRedirects.desktop || undefined
      },
      geoRedirects: Object.keys(geoRecord).length > 0 ? geoRecord : undefined,
      startDate: startDate ? new Date(startDate).getTime() : null,
      expirationDate: expirationDate ? new Date(expirationDate).getTime() : null,
      maxClicks: clickLimit ? parseInt(clickLimit) : null,
      password: password || null,
      tags: tags,
      folderId: folderId,
      abTestConfig: abTestEnabled ? {
        enabled: true,
        variants: variants
      } : undefined,
      domain: selectedDomain !== 'links.trak.in' ? selectedDomain : undefined
    };

    if (editingLink) {
      onUpdate(editingLink.id, {
        ...commonData,
        tags: tags.length > 0 ? tags : (analysis?.tags || editingLink.tags),
        aiAnalysis: analysis ? {
          sentiment: analysis.sentiment,
          category: analysis.category,
          predictedEngagement: analysis.predictedEngagement
        } : editingLink.aiAnalysis
      });
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
      onCreate(newLink);
    }
    resetAndClose();
  };

  const handleBulkSubmit = () => {
    const urls = bulkUrls.split('\n').filter(u => u.trim().length > 0);
    const newLinks: LinkData[] = urls.map(u => ({
      id: uuidv4(),
      originalUrl: u.trim(),
      shortCode: Math.random().toString(36).substring(2, 8),
      title: u.trim(),
      description: 'Bulk created link',
      tags: ['bulk'],
      clicks: 0,
      clickHistory: [],
      createdAt: Date.now(),
      smartRedirects: {},
      aiAnalysis: undefined
    }));

    onBulkCreate(newLinks);
    resetAndClose();
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

          linksToCreate.push({
            id: uuidv4(),
            originalUrl: url.startsWith('http') ? url : `https://${url}`,
            shortCode: slug || uuidv4().slice(0, 8),
            title: title,
            tags: tags,
            clicks: 0,
            clickHistory: [],
            createdAt: Date.now()
          });
        }

        if (linksToCreate.length === 0) {
          throw new Error('No valid links found in CSV.');
        }

        await supabaseAdapter.createLinks(linksToCreate);
        onBulkCreate(linksToCreate); // Optimistic UI update
        resetAndClose();

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
      setAnalysis(null);
      setBulkUrls('');
      setSmartRedirects({ ios: '', android: '', desktop: '' });
      setGeoRedirects([]);
      setStartDate('');
      setExpirationDate('');
      setClickLimit('');
      setPassword('');
      setTags([]);
      setFolderId(null);
      setSelectedDomain('links.trak.in');
      setAbTestEnabled(false);
      setVariants([]);
      setMode('single');
      setShowAdvanced(false);
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-2xl transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white text-left shadow-xl transition-all h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {editingLink ? 'Edit Link' : 'Create New Link'}
                </h3>
                <p className="text-xs text-stone-500">
                  {mode === 'single' ? 'Shorten a single URL' : 'Batch create multiple links'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* Tabs - Only show in Create Mode */}
            {!editingLink && (
              <div className="flex border-b border-stone-100 bg-[#FDFBF7]/30">
                <div className="flex p-1 bg-stone-100 rounded-xl w-full">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'single'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    Single Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('bulk')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'bulk'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    Bulk Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('csv')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === 'csv'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    Import CSV
                  </button>
                </div>
              </div>
            )}

            {mode === 'single' ? (
              <>
                {/* URL Input */}
                <div className="mb-8">
                  <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Destination URL</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder="https://example.com/my-long-url"
                        className="w-full bg-stone-50 border border-stone-200 text-slate-900 p-4 rounded-xl pl-12 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                      />
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <button
                        type="button"
                        onClick={() => setShowUTMBuilder(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                        title="UTM Builder"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={!url || isAnalyzing}
                      className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-400/20 min-w-[140px] justify-center"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Auto-Fill with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Analysis Result */}
                {analysis && (
                  <div className="mb-8 bg-amber-50 rounded-2xl p-5 border border-amber-100 animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Wand2 className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-amber-700 relative z-10">
                      <Wand2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Gemini Insights</span>
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg mb-1 relative z-10">{analysis.title}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed relative z-10">{analysis.description}</p>

                    <div className="flex gap-2 mt-4 relative z-10">
                      {(analysis.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] uppercase font-bold bg-white text-amber-700 px-2 py-1 rounded border border-amber-200">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSingleSubmit}>
                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Short Link (Slug)</label>
                    <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-0 py-0 focus-within:ring-2 focus-within:ring-amber-500/20 focus:border-amber-500 transition-all overflow-hidden relative">
                      {domains.length > 0 ? (
                        <div className="relative border-r border-stone-200 bg-stone-100/50 h-full flex items-center">
                          <select
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            className="appearance-none bg-transparent pl-3 pr-8 py-3 text-stone-600 font-mono text-sm font-medium focus:outline-none cursor-pointer hover:bg-stone-200/50 transition-colors h-full"
                          >
                            <option value="links.trak.in">links.trak.in</option>
                            {domains.map(d => (
                              <option key={d.id} value={d.domain}>{d.domain}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-stone-500 font-mono text-sm pl-4 pr-3 py-3 border-r border-stone-200 bg-stone-100/50">links.trak.in/</span>
                      )}

                      {selectedDomain !== 'links.trak.in' && (
                        <span className="text-stone-400 font-mono text-sm pl-2 py-3 select-none">/</span>
                      )}

                      <input
                        type="text"
                        placeholder="custom-slug"
                        className="bg-transparent border-none text-slate-900 p-2.5 w-full focus:outline-none focus:ring-0 font-medium placeholder:text-stone-400"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tags and Folder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Tags</label>
                      <TagInput
                        userId={user?.id || ''}
                        selectedTags={tags}
                        onChange={setTags}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Folder</label>
                      <select
                        value={folderId || ''}
                        onChange={(e) => setFolderId(e.target.value || null)}
                        className="w-full bg-stone-50 border border-stone-200 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        <option value="">No Folder</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-stone-600 text-sm font-bold mb-4 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Advanced Options
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-6 mb-8 p-6 bg-stone-50 rounded-2xl border border-stone-200 animate-fadeIn">

                      {/* Device Targets */}
                      <div>
                        <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-amber-500" /> Device Targeting
                          <InfoTooltip
                            id="device-targeting-help"
                            content="Redirect users to specific URLs based on their device (iOS, Android, or Desktop). Great for app downloads."
                          />
                        </h4>
                        <div className="space-y-3">
                          <input type="text" placeholder="iOS Destination (App Store)" className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400" value={smartRedirects.ios} onChange={e => setSmartRedirects({ ...smartRedirects, ios: e.target.value })} />
                          <input type="text" placeholder="Android Destination (Play Store)" className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400" value={smartRedirects.android} onChange={e => setSmartRedirects({ ...smartRedirects, android: e.target.value })} />
                        </div>
                      </div>

                      {/* Geo Targets */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4 text-amber-500" /> Geo-Targeting
                            <InfoTooltip
                              id="geo-targeting-help"
                              content="Redirect users to different URLs based on their country. Useful for localized content or regional stores."
                            />
                          </h4>
                          <button type="button" onClick={handleAddGeoRule} className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-bold transition-colors">+ Add Rule</button>
                        </div>

                        {geoRedirects.map((rule, idx) => (
                          <div key={idx} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="US"
                              className="w-20 bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl uppercase text-center font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400"
                              maxLength={2}
                              value={rule.country}
                              onChange={e => updateGeoRule(idx, 'country', e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="https://us.example.com"
                              className="flex-1 bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400"
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

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                        <div>
                          <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Start Date
                          </label>
                          <input type="datetime-local" className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> End Date
                          </label>
                          <input type="datetime-local" className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200">
                        <div>
                          <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 block">Click Limit</label>
                          <input type="number" placeholder="∞" className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400" value={clickLimit} onChange={e => setClickLimit(e.target.value)} />
                        </div>
                      </div>

                      {/* Password Protection */}
                      <div className="pt-2 border-t border-stone-200">
                        <label className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Password Protection
                        </label>
                        <input
                          type="text"
                          placeholder="Optional: Set a password"
                          className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                      </div>

                      {/* A/B Testing */}
                      <div className="pt-2 border-t border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-xs text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Split className="w-3 h-3" /> A/B Testing
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-medium">{abTestEnabled ? 'Enabled' : 'Disabled'}</span>
                            <button
                              type="button"
                              onClick={() => setAbTestEnabled(!abTestEnabled)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${abTestEnabled ? 'bg-amber-500' : 'bg-stone-200'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${abTestEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>

                        {abTestEnabled && (
                          <div className="space-y-3 animate-fadeIn">
                            <p className="text-xs text-stone-500 mb-2">
                              Add variants to split traffic. Weights determine the percentage of traffic each URL receives.
                            </p>

                            {variants.map((variant, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-stone-400 w-4">{String.fromCharCode(65 + idx)}</span>
                                <input
                                  type="url"
                                  placeholder="https://variant-url.com"
                                  className="flex-1 bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400"
                                  value={variant.url}
                                  onChange={e => {
                                    const newVariants = [...variants];
                                    newVariants[idx].url = e.target.value;
                                    setVariants(newVariants);
                                  }}
                                />
                                <div className="relative w-24">
                                  <input
                                    type="number"
                                    placeholder="%"
                                    min="0"
                                    max="100"
                                    className="w-full bg-white border border-stone-200 text-sm text-slate-900 p-3 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-stone-400 pr-8"
                                    value={variant.weight}
                                    onChange={e => {
                                      const newVariants = [...variants];
                                      newVariants[idx].weight = parseInt(e.target.value) || 0;
                                      setVariants(newVariants);
                                    }}
                                  />
                                  <span className="absolute right-3 top-3 text-stone-400 text-xs font-bold">%</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariants = variants.filter((_, i) => i !== idx);
                                    setVariants(newVariants);
                                  }}
                                  className="text-stone-400 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => setVariants([...variants, { id: uuidv4(), url: '', weight: 50 }])}
                              className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg font-bold transition-colors w-full flex items-center justify-center gap-2"
                            >
                              <Split className="w-3 h-3" /> Add Variant
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="px-6 py-3 text-stone-500 hover:text-slate-900 font-bold transition-colors hover:bg-stone-50 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!url || !slug}
                      className="bg-amber-400 text-slate-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-amber-400/20"
                    >
                      {editingLink ? 'Save Changes' : 'Create Link'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Paste URLs (One per line)</label>
                  <textarea
                    className="w-full h-64 bg-stone-50 border border-stone-200 text-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-sm leading-relaxed placeholder:text-stone-400"
                    placeholder={`https://google.com\nhttps://youtube.com\nhttps://twitter.com`}
                    value={bulkUrls}
                    onChange={e => setBulkUrls(e.target.value)}
                  />
                  <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Up to 50 URLs allowed per batch.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-stone-100 mt-auto">
                  <button onClick={resetAndClose} className="px-6 py-3 text-stone-500 hover:text-slate-900 font-bold hover:bg-stone-50 rounded-xl">Cancel</button>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={!bulkUrls.trim()}
                    className="bg-amber-400 text-slate-900 hover:bg-amber-500 disabled:opacity-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-400/20"
                  >
                    <Layers className="w-4 h-4" /> Bulk Generate
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <UTMBuilderModal
          isOpen={showUTMBuilder}
          onClose={() => setShowUTMBuilder(false)}
          baseUrl={url}
          onApply={(newUrl) => setUrl(newUrl)}
        />
      </div>
    </div >
  );
};

export default CreateLinkModal;