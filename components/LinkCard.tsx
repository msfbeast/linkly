import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, BarChart2, Share2, Trash2, Calendar, Loader2, Twitter, Smartphone, Globe, Pencil, Lock, GripVertical, Clock, AlertCircle, CheckCircle2, Download, Copy as CopyIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QRCodeGenerator from './QRCodeGenerator';
import { QRCodeCanvas } from 'qrcode.react';
import { LinkData } from '../types';
import { generateSocialPost } from '../services/geminiService';
import { checkLinkHealth, getHealthColor, getHealthTooltip } from '../services/linkHealthService';


interface LinkCardProps {
  link: LinkData;
  onDelete: (id: string) => void;
  onEdit: (link: LinkData) => void;
  onDuplicate?: (link: LinkData) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onDelete,
  onEdit,
  onDuplicate,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const [showQr, setShowQr] = useState(false);
  const navigate = useNavigate();
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'broken' | 'unknown'>('unknown');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id, data: { link } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const fullShortUrl = `${window.location.origin}/r/${link.shortCode}`;

  useEffect(() => {
    const checkHealth = async () => {
      if (link.originalUrl) {
        const result = await checkLinkHealth(link.originalUrl);
        setHealthStatus(result.status);
      }
    };

    // Initial check
    checkHealth();

    // Re-check when URL changes
  }, [link.originalUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
  };

  const handleGeneratePost = async () => {
    setIsGeneratingPost(true);
    const post = await generateSocialPost(link);
    setGeneratedPost(post);
    setIsGeneratingPost(false);
  };

  // Reference for hidden QR canvas
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Quick download QR code as PNG
  const handleQuickDownloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    // Create download link
    const downloadLink = document.createElement('a');
    const sanitizedTitle = (link.title || 'qr-code').replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    downloadLink.download = `${sanitizedTitle}.png`;
    downloadLink.href = canvas.toDataURL('image/png');
    downloadLink.click();
  };



  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        whileHover={{ scale: 1.01 }}
        className={`bg-white border ${selected ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-white/60'} rounded-[2rem] p-1 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group relative mb-6 ${isDragging ? 'opacity-50 rotate-3 scale-105 shadow-2xl cursor-grabbing' : ''}`}
      >
        {/* Health Indicator */}
        <div
          className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getHealthColor(healthStatus)} ring-2 ring-white cursor-help transition-colors duration-300`}
          title={getHealthTooltip(healthStatus)}
        >
          {healthStatus === 'broken' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 opacity-20"></span>
            </span>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
            {/* Main Info */}
            <div className="flex-1 min-w-0">

              {/* Header Row: Drag Handle, Badges, Tags, Date */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* Drag Handle or Checkbox */}
                {selectable && onSelect ? (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => onSelect(link.id, e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-yellow-500 focus:ring-yellow-500 cursor-pointer mr-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    {...listeners}
                    {...attributes}
                    className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}

                {/* Status Badges */}
                {(() => {
                  const now = Date.now();
                  const isScheduled = link.startDate && now < link.startDate;
                  const isExpired = link.expirationDate && now > link.expirationDate;
                  const isActive = (!link.startDate || now >= link.startDate) && (!link.expirationDate || now <= link.expirationDate);

                  if (isScheduled) {
                    return (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title={`Starts: ${new Date(link.startDate!).toLocaleString()}`}>
                        <Clock className="w-3 h-3" /> Scheduled
                      </span>
                    );
                  }
                  if (isExpired) {
                    return (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title={`Expired: ${new Date(link.expirationDate!).toLocaleString()}`}>
                        <AlertCircle className="w-3 h-3" /> Expired
                      </span>
                    );
                  }
                  // Optional: Show Active badge if it has dates but is currently active
                  if (isActive && (link.startDate || link.expirationDate)) {
                    return (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title="Link is active">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    );
                  }
                  return null;
                })()}

                {link.password && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 border border-amber-200 flex-shrink-0" title="Password Protected">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                {link.smartRedirects && (link.smartRedirects.ios || link.smartRedirects.android) && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200 flex-shrink-0" title="Smart Redirects">
                    <Smartphone className="w-3 h-3" />
                  </span>
                )}
                {link.geoRedirects && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex-shrink-0" title="Geo Targeting">
                    <Globe className="w-3 h-3" />
                  </span>
                )}

                {link.aiAnalysis?.category && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200 flex-shrink-0">
                    {link.aiAnalysis.category}
                  </span>
                )}

                {/* Tags */}
                {link.tags && link.tags.length > 0 && link.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
                    #{tag}
                  </span>
                ))}

                {/* Date - Pushed to end */}
                <span className="text-stone-400 text-xs flex items-center gap-1 ml-auto flex-shrink-0">
                  <Calendar className="w-3 h-3" />
                  {new Date(link.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                {/* Website Favicon */}
                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0 mt-1">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(link.originalUrl).hostname}&sz=64`}
                    alt=""
                    className="w-6 h-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Globe className="w-5 h-5 text-stone-400 hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/analytics/${link.id}`)}
                    className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-yellow-600 transition-colors text-left hover:underline decoration-yellow-400/50 underline-offset-4 w-full block"
                  >
                    {link.title}
                  </button>
                  <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-stone-500 text-xs truncate block hover:text-stone-800 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{link.originalUrl}</span>
                  </a>
                </div>
              </div>

              {/* Short Link Action Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl pl-3 pr-1 py-1 group/bar transition-colors hover:border-yellow-400/50 hover:bg-yellow-50/50 max-w-full">
                  <span className="text-stone-400 text-xs sm:text-sm flex-shrink-0">links.trak.in/</span>
                  <span className="text-slate-900 font-mono text-xs sm:text-sm font-bold ml-0.5 truncate">{link.shortCode}</span>
                  <div className="w-px h-4 bg-stone-200 mx-2 sm:mx-3 flex-shrink-0"></div>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-200 transition-all active:scale-95 flex-shrink-0" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 ml-auto sm:ml-0">
                  {healthStatus === 'broken' && (
                    <button
                      onClick={() => onEdit(link)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-xs font-bold mr-2 animate-pulse"
                      title="Link is broken. Click to fix."
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Fix Link
                    </button>
                  )}
                  <button onClick={() => navigate(`/analytics/${link.id}`)} className="p-2 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition-all" title="Analytics">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowQr(!showQr)} className={`p-2 rounded-lg transition-all ${showQr ? 'text-yellow-600 bg-yellow-100' : 'text-stone-400 hover:text-slate-900 hover:bg-stone-100'}`} title="QR Code">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleQuickDownloadQR}
                    className="p-2 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Download QR Code"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-6 justify-between border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6 mt-2 lg:mt-0">
              <div className="text-left lg:text-right">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{link.clicks}</div>
                <div className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-wider">Clicks</div>
                {/* Click Goal Progress Bar */}
                {link.clickGoal && link.clickGoal > 0 && (
                  <div className="mt-2 w-24 lg:w-20">
                    <div className="flex items-center justify-between text-[9px] font-bold mb-1">
                      <span className="text-amber-600">🎯 Goal</span>
                      <span className="text-stone-500">{Math.min(Math.round((link.clicks / link.clickGoal) * 100), 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${link.clicks >= link.clickGoal
                            ? 'bg-emerald-500'
                            : link.clicks >= link.clickGoal * 0.75
                              ? 'bg-amber-500'
                              : 'bg-amber-400'
                          }`}
                        style={{ width: `${Math.min((link.clicks / link.clickGoal) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-stone-400 mt-0.5">{link.clicks}/{link.clickGoal}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(link)}
                  className="p-2 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {onDuplicate && (
                  <button
                    onClick={() => onDuplicate(link)}
                    className="p-2 rounded-lg text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                    title="Duplicate Link"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleGeneratePost}
                  disabled={isGeneratingPost}
                  className="p-2 rounded-lg text-stone-400 hover:text-sky-500 hover:bg-sky-50 transition-all relative"
                  title="AI Tweet"
                >
                  {isGeneratingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4" />}
                  {generatedPost && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white border border-stone-200 rounded-xl shadow-xl z-50 text-left">
                      <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap font-sans leading-relaxed">{generatedPost}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(generatedPost); }}
                        className="text-[10px] bg-sky-100 text-sky-600 px-2 py-1.5 rounded-md w-full hover:bg-sky-200 font-medium transition-colors"
                      >
                        Copy Tweet
                      </button>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onDelete(link.id)}
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable QR Section */}
        {showQr && (
          <div className="mt-4 p-6 bg-stone-50 border-t border-stone-200 rounded-b-xl animate-fadeIn">
            <QRCodeGenerator url={fullShortUrl} title={link.title} />
          </div>
        )}

      </motion.div >
      {/* Hidden QR Canvas for Quick Download */}
      <div className="hidden">
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={fullShortUrl}
          size={400}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
    </>
  );
};

export default LinkCard;