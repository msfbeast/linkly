import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, BarChart2, Share2, Trash2, Calendar, Loader2, Twitter, Smartphone, Globe, Pencil, Lock } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { LinkData } from '../types';
import { generateSocialPost } from '../services/geminiService';


interface LinkCardProps {
  link: LinkData;
  onDelete: (id: string) => void;
  onEdit: (link: LinkData) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onDelete, onEdit }) => {
  const [showQr, setShowQr] = useState(false);
  const navigate = useNavigate();
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);

  const fullShortUrl = `${window.location.origin}/#/r/${link.shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
  };

  const handleGeneratePost = async () => {
    setIsGeneratingPost(true);
    const post = await generateSocialPost(link);
    setGeneratedPost(post);
    setIsGeneratingPost(false);
  };



  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        whileHover={{ scale: 1.01 }}
        className="bg-white border border-stone-200/60 rounded-xl p-1 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group relative mb-4"
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                {/* Status Badges */}
                {link.password && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 border border-amber-200" title="Password Protected">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                {link.smartRedirects && (link.smartRedirects.ios || link.smartRedirects.android) && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200" title="Smart Redirects">
                    <Smartphone className="w-3 h-3" />
                  </span>
                )}
                {link.geoRedirects && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200" title="Geo Targeting">
                    <Globe className="w-3 h-3" />
                  </span>
                )}

                {link.aiAnalysis?.category && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-200">
                    {link.aiAnalysis.category}
                  </span>
                )}

                <span className="text-stone-400 text-xs flex items-center gap-1 ml-auto lg:ml-0">
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
                  <span className="text-stone-400 text-xs sm:text-sm flex-shrink-0">link.ly/</span>
                  <span className="text-slate-900 font-mono text-xs sm:text-sm font-bold ml-0.5 truncate">{link.shortCode}</span>
                  <div className="w-px h-4 bg-stone-200 mx-2 sm:mx-3 flex-shrink-0"></div>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-200 transition-all active:scale-95 flex-shrink-0" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 ml-auto sm:ml-0">
                  <button onClick={() => navigate(`/analytics/${link.id}`)} className="p-2 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition-all" title="Analytics">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowQr(!showQr)} className={`p-2 rounded-lg transition-all ${showQr ? 'text-yellow-600 bg-yellow-100' : 'text-stone-400 hover:text-slate-900 hover:bg-stone-100'}`} title="QR Code">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-6 justify-between border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6 mt-2 lg:mt-0">
              <div className="text-left lg:text-right">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{link.clicks}</div>
                <div className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-wider">Clicks</div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(link)}
                  className="p-2 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
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

          {/* Expandable QR Section */}
          {showQr && (
            <div className="mt-4 p-6 bg-stone-50 border-t border-stone-200 rounded-b-xl animate-fadeIn">
              <QRCodeGenerator url={fullShortUrl} title={link.title} />
            </div>
          )}
        </div>
      </motion.div>


    </>
  );
};

export default LinkCard;