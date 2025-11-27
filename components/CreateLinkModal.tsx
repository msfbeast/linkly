import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Link as LinkIcon, Loader2, Wand2, Smartphone, Globe, Layers, Trash, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeUrlWithGemini, GeminiAnalysisResult } from '../services/geminiService';
import { LinkData, SmartRedirects } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (link: LinkData) => void;
  onUpdate: (id: string, link: Partial<LinkData>) => void;
  onBulkCreate: (links: LinkData[]) => void;
  editingLink?: LinkData | null;
}

const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ isOpen, onClose, onCreate, onUpdate, onBulkCreate, editingLink }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single Mode States
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);

  // Bulk Mode States
  const [bulkUrls, setBulkUrls] = useState('');

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smartRedirects, setSmartRedirects] = useState<SmartRedirects>({ ios: '', android: '', desktop: '' });
  const [geoRedirects, setGeoRedirects] = useState<{ country: string, url: string }[]>([]);
  const [expirationDate, setExpirationDate] = useState('');
  const [clickLimit, setClickLimit] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (editingLink) {
      setMode('single');
      setUrl(editingLink.originalUrl);
      setSlug(editingLink.shortCode);
      setSmartRedirects({
        ios: editingLink.smartRedirects?.ios || '',
        android: editingLink.smartRedirects?.android || '',
        desktop: editingLink.smartRedirects?.desktop || '',
      });

      const geoArray = editingLink.geoRedirects
        ? Object.entries(editingLink.geoRedirects).map(([k, v]) => ({ country: k, url: v }))
        : [];
      setGeoRedirects(geoArray);

      setExpirationDate(editingLink.expirationDate ? new Date(editingLink.expirationDate).toISOString().slice(0, 16) : '');
      setClickLimit(editingLink.maxClicks ? editingLink.maxClicks.toString() : '');
      setPassword(editingLink.password || '');

      if (editingLink.smartRedirects?.ios || editingLink.smartRedirects?.android || geoArray.length > 0 || editingLink.expirationDate || editingLink.maxClicks || editingLink.password) {
        setShowAdvanced(true);
      }
    }
  }, [editingLink, isOpen]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeUrlWithGemini(url);
      setAnalysis(result);
      if (!slug && !editingLink) setSlug(result.suggestedSlug);
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
      smartRedirects: {
        ios: smartRedirects.ios || undefined,
        android: smartRedirects.android || undefined,
        desktop: smartRedirects.desktop || undefined
      },
      geoRedirects: Object.keys(geoRecord).length > 0 ? geoRecord : undefined,
      expirationDate: expirationDate ? new Date(expirationDate).getTime() : null,
      maxClicks: clickLimit ? parseInt(clickLimit) : null,
      password: password || null,
    };

    if (editingLink) {
      onUpdate(editingLink.id, {
        ...commonData,
        title: analysis?.title || editingLink.title,
        description: analysis?.description || editingLink.description,
        tags: analysis?.tags || editingLink.tags,
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
        title: analysis?.title || 'Untitled Link',
        description: analysis?.description || '',
        tags: analysis?.tags || [],
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

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setUrl('');
      setSlug('');
      setAnalysis(null);
      setBulkUrls('');
      setSmartRedirects({ ios: '', android: '', desktop: '' });
      setGeoRedirects([]);
      setExpirationDate('');
      setClickLimit('');
      setPassword('');
      setMode('single');
      setShowAdvanced(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={resetAndClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-[#12121a] backdrop-blur-xl border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/50 dark:shadow-cyan-500/5 flex flex-col max-h-[90vh]"
      >{/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{editingLink ? 'Edit Link' : 'Create New Link'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{editingLink ? 'Update destination and settings' : 'Supercharge your URLs with AI'}</p>
          </div>
          <button onClick={resetAndClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Only show in Create Mode */}
        {!editingLink && (
          <div className="flex border-b border-slate-200 dark:border-white/5">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${mode === 'single' ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Single Link
              {mode === 'single' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 dark:shadow-[0_0_10px_#00d4ff]" />}
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${mode === 'bulk' ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Bulk Create
              {mode === 'bulk' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 dark:shadow-[0_0_10px_#00d4ff]" />}
            </button>
          </div>
        )}

        <div className="p-8 overflow-y-auto custom-scrollbar">

          {mode === 'single' ? (
            <>
              {/* URL Input */}
              <div className="mb-8">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Destination URL</label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-500 dark:group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="url"
                      placeholder="https://example.com/very-long-url..."
                      className="w-full bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!url || isAnalyzing}
                    className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-semibold px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 min-w-[140px] justify-center"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>AI Analyze</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Analysis Result */}
              {analysis && (
                <div className="mb-8 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-5 border border-cyan-500/20 animate-fadeIn relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wand2 className="w-24 h-24 text-cyan-500" />
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-cyan-600 dark:text-cyan-400 relative z-10">
                    <Wand2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Gemini Insights</span>
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1 relative z-10">{analysis.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed relative z-10">{analysis.description}</p>

                  <div className="flex gap-2 mt-4 relative z-10">
                    {analysis.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded border border-cyan-500/20">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSingleSubmit}>
                <div className="mb-8">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Short Link (Slug)</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-1 focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all">
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm mr-2 border-r border-slate-200 dark:border-white/10 pr-2 py-2.5">link.ly/</span>
                    <input
                      type="text"
                      placeholder="custom-slug"
                      className="bg-transparent border-none text-slate-900 dark:text-white p-2.5 w-full focus:outline-none focus:ring-0 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                {/* Advanced Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-slate-600 dark:text-slate-300 text-sm font-medium mb-4 p-4 bg-slate-50 dark:bg-[#0a0a0f] rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Advanced Options
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="space-y-6 mb-8 p-6 bg-slate-50 dark:bg-[#0a0a0f] rounded-xl border border-slate-200 dark:border-white/10 animate-fadeIn">

                    {/* Device Targets */}
                    <div>
                      <h4 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Device Targeting
                      </h4>
                      <div className="space-y-3">
                        <input type="text" placeholder="iOS Destination (App Store)" className="w-full bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={smartRedirects.ios} onChange={e => setSmartRedirects({ ...smartRedirects, ios: e.target.value })} />
                        <input type="text" placeholder="Android Destination (Play Store)" className="w-full bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" value={smartRedirects.android} onChange={e => setSmartRedirects({ ...smartRedirects, android: e.target.value })} />
                      </div>
                    </div>

                    {/* Geo Targets */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Geo-Targeting
                        </h4>
                        <button type="button" onClick={handleAddGeoRule} className="text-xs bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg font-bold transition-colors">+ Add Rule</button>
                      </div>

                      {geoRedirects.map((rule, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="US"
                            className="w-20 bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl uppercase text-center font-bold focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            maxLength={2}
                            value={rule.country}
                            onChange={e => updateGeoRule(idx, 'country', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="https://us.example.com"
                            className="flex-1 bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            value={rule.url}
                            onChange={e => updateGeoRule(idx, 'url', e.target.value)}
                          />
                          <button type="button" onClick={() => removeGeoRule(idx)} className="text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-3 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {geoRedirects.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-2">No geo-rules added yet.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-white/5">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Expiration Date</label>
                        <input type="datetime-local" className="w-full bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Click Limit</label>
                        <input type="number" placeholder="∞" className="w-full bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={clickLimit} onChange={e => setClickLimit(e.target.value)} />
                      </div>
                    </div>

                    {/* Password Protection */}
                    <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                      <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Password Protection
                      </label>
                      <input
                        type="text"
                        placeholder="Optional: Set a password"
                        className="w-full bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!url || !slug}
                    className="bg-cyan-500 text-white dark:text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-cyan-500/20"
                  >
                    {editingLink ? 'Save Changes' : 'Create Link'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Paste URLs (One per line)</label>
                <textarea
                  className="w-full h-64 bg-slate-50 dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder={`https://google.com\nhttps://youtube.com\nhttps://twitter.com`}
                  value={bulkUrls}
                  onChange={e => setBulkUrls(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Up to 50 URLs allowed per batch.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5 mt-auto">
                <button onClick={resetAndClose} className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">Cancel</button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={!bulkUrls.trim()}
                  className="bg-cyan-500 text-white dark:text-black hover:bg-cyan-400 disabled:opacity-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Layers className="w-4 h-4" /> Bulk Generate
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CreateLinkModal;