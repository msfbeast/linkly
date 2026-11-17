import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, BarChart2, Share2, Trash2, Calendar, Loader2, Twitter, Smartphone, Globe, Pencil, Lock, GripVertical, Clock, AlertCircle, CheckCircle2, Download, Copy as CopyIcon, QrCode, RotateCcw } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QRCodeGenerator from './QRCodeGenerator';
import { QRCodeCanvas } from 'qrcode.react';
import { LinkData } from '../types';
import { generateSocialPost } from '../services/geminiService';
import { checkLinkHealth, getHealthColor, getHealthTooltip } from '../services/linkHealthService';
import ConfirmationModal from './ConfirmationModal';


interface LinkCardProps {
  link: LinkData;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onEdit: (link: LinkData) => void;
  onDuplicate?: (link: LinkData) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({
  link,
  onDelete,
  onArchive,
  onRestore,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const domain = link.domain || 'links.trak.in';
  const fullShortUrl = domain === 'links.trak.in'
    ? `${window.location.origin}/r/${link.shortCode}`
    : `https://${domain}/${link.shortCode}`;

  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      if (isVisible && link.originalUrl) {
        const result = await checkLinkHealth(link.originalUrl);
        setHealthStatus(result.status);
      }
    };

    checkHealth();
  }, [isVisible, link.originalUrl]);

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        ref={(node) => {
          setNodeRef(node);
          (cardRef as any).current = node;
        }}
        style={style}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className={`bg-white border ${selected ? 'border-[#FF5A14] ring-1 ring-[#FF5A14]' : 'border-transparent'} rounded-3xl p-1 transition-colors hover:border-[#E6E3DD] group relative mb-2.5 ${isDragging ? 'opacity-50 rotate-1 shadow-2xl cursor-grabbing' : ''}`}
      >
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Drag handle or checkbox */}
            {selectable && onSelect ? (
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect(link.id, e.target.checked)}
                aria-label={`Select ${link.title}`}
                className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-stone-300 text-[#FF5A14] focus:ring-[#FF5A14]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                {...listeners}
                {...attributes}
                className="-ml-1 flex-shrink-0 cursor-grab p-1 text-[#D9D6D0] transition-colors hover:text-[#8C8981] active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}

                {/* Website Favicon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F0EEEA]">
                  <img
                    src={(() => {
                      try {
                        const urlStr = link.originalUrl.startsWith('http') ? link.originalUrl : `https://${link.originalUrl}`;
                        const u = new URL(urlStr);
                        return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
                      } catch {
                        return `https://www.google.com/s2/favicons?domain=oia.bio&sz=64`; // Default fallback
                      }
                    })()}
                    alt=""
                    className="w-6 h-6 object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const fallback = img.parentElement?.querySelector('.favicon-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="favicon-fallback hidden items-center justify-center">
                    <Globe className="w-5 h-5 text-stone-400" />
                  </div>
                </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <button
                  onClick={() => navigate(`/analytics/${link.id}`)}
                  data-tour="link-card"
                  className="max-w-full truncate text-left text-[15px] font-semibold text-[#18181A] underline-offset-4 hover:underline"
                >
                  {link.title}
                </button>
                <span
                  className={`h-2 w-2 flex-shrink-0 cursor-help rounded-full ${getHealthColor(healthStatus)}`}
                  title={getHealthTooltip(healthStatus)}
                />
                {link.disabledAt && (
                  <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700" title="Taken down after a report. Contact support if you think this is a mistake.">
                    <AlertCircle className="h-3 w-3" /> Disabled
                  </span>
                )}
                {/* Status Badges */}
                {(() => {
                  const now = Date.now();
                  const isScheduled = link.startDate && now < link.startDate;
                  const isExpired = link.expirationDate && now > link.expirationDate;
                  const isLimitReached = link.maxClicks && link.clicks >= link.maxClicks;

                  // Check if expiring within 48 hours
                  const hoursUntilExpiration = link.expirationDate ? (link.expirationDate - now) / (1000 * 60 * 60) : null;
                  const isExpiringSoon = hoursUntilExpiration !== null && hoursUntilExpiration > 0 && hoursUntilExpiration <= 48;

                  const isActive = (!link.startDate || now >= link.startDate) && (!link.expirationDate || now <= link.expirationDate) && !isLimitReached;

                  if (isLimitReached) {
                    return (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title={`Limit reached: ${link.clicks}/${link.maxClicks} clicks`}>
                        <AlertCircle className="w-3 h-3" /> Limit Reached
                      </span>
                    );
                  }

                  if (isScheduled) {
                    return (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title={`Starts: ${new Date(link.startDate!).toLocaleString()}`}>
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

                  if (isActive) {
                    return (
                      <>
                        {isExpiringSoon && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider flex-shrink-0" title={`Expires in ${Math.ceil(hoursUntilExpiration!)} hours`}>
                            <Clock className="w-3 h-3" /> Expiring Soon
                          </span>
                        )}
                        {(link.startDate || link.expirationDate || link.maxClicks) && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isExpiringSoon ? 'bg-transparent text-stone-500 border-stone-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`} title="Link is active">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </>
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
                  <span key={i} className="flex-shrink-0 rounded-full bg-[#F0EEEA] px-2 py-0.5 font-mono text-[10px] text-[#8C8981]">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-2 font-mono text-[12px]">
                <button
                  onClick={handleCopy}
                  title="Copy short link"
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-md text-[#18181A] hover:text-[#C2410C]"
                >
                  <span><span className="text-[#8C8981]">{domain}/</span>{link.shortCode}</span>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-[#A19E97]" />}
                </button>
                <span className="text-[#D9D6D0]">→</span>
                <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[#8C8981] hover:text-[#18181A]">
                  {link.originalUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            {/* Actions */}
            <div className="flex items-center">
              {healthStatus === 'broken' && (
                <button
                  onClick={() => onEdit(link)}
                  className="mr-1 flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200"
                  title="The destination isn't responding. Click to fix."
                >
                  <AlertCircle className="h-3.5 w-3.5" /> Fix link
                </button>
              )}
              <button onClick={() => navigate(`/analytics/${link.id}`)} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]" title="Analytics" aria-label="Analytics">
                <BarChart2 className="h-4 w-4" />
              </button>
              <button onClick={() => setShowQr(!showQr)} className={showQr ? 'rounded-lg bg-[#FFE9DE] p-2 text-[#C2410C]' : 'rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]'} title="QR code" aria-label="QR code" aria-expanded={showQr}>
                <QrCode className="h-4 w-4" />
              </button>
              <button onClick={handleQuickDownloadQR} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A] hidden sm:block" title="Download QR code" aria-label="Download QR code">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => onEdit(link)} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]" title="Edit" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              {onDuplicate && (
                <button onClick={() => onDuplicate(link)} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A] hidden sm:block" title="Duplicate" aria-label="Duplicate">
                  <CopyIcon className="h-4 w-4" />
                </button>
              )}
              {onRestore && (
                <button onClick={() => onRestore(link.id)} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-[#F0EEEA] hover:text-[#18181A]" title="Restore" aria-label="Restore">
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setShowDeleteConfirm(true)} className="rounded-lg p-2 text-[#A19E97] transition-colors hover:bg-red-50 hover:text-red-600" title="Delete" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Clicks */}
            <div className="w-24 flex-shrink-0 text-right">
              <div className="font-mono text-[22px] font-medium leading-none tracking-[-0.03em] text-[#18181A]">{link.clicks.toLocaleString('en-IN')}</div>
              <div className="mt-1 text-[11px] text-[#8C8981]">clicks · {new Date(link.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
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
          </div>
        </div>

        {/* Expandable QR Section */}
        {showQr && (
          <div className="mx-1 mb-1 rounded-[20px] bg-[#F7F6F3] p-6 animate-fadeIn">
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

      {onArchive ? (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => { onArchive(link.id); setShowDeleteConfirm(false); }}
          onSecondary={() => { onDelete(link.id); setShowDeleteConfirm(false); }}
          title="Delete link"
          description="Would you like to archive this link instead? Archived links are hidden but can be restored."
          confirmLabel="Archive (Recommended)"
          secondaryLabel="Delete Permanently"
        />
      ) : (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => { onDelete(link.id); setShowDeleteConfirm(false); }}
          title="Delete link"
          description={`"${link.title}" will stop working and its click history will be removed. This cannot be undone.`}
          confirmLabel="Delete permanently"
          type="danger"
        />
      )}
    </>
  );
};

export default LinkCard;