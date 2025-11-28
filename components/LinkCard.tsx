import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, BarChart2, Share2, Trash2, Calendar, MousePointer2, Loader2, Twitter, Smartphone, X, Globe, Pencil, Lock, MoreHorizontal } from 'lucide-react';
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
  const [qrColor, setQrColor] = useState('#000000');
  const [showAnalytics, setShowAnalytics] = useState(false);
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
        className="bg-white border border-stone-200 rounded-[2rem] p-1 transition-all hover:shadow-md group relative mb-4"
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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

                <span className="text-stone-400 text-xs flex items-center gap-1 ml-auto md:ml-0">
                  <Calendar className="w-3 h-3" />
                  {new Date(link.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Website Favicon */}
                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    className="text-lg font-bold text-slate-900 truncate group-hover:text-yellow-600 transition-colors text-left hover:underline decoration-yellow-400/50 underline-offset-4"
                  >
                    {link.title}
                  </button>
                  <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-stone-500 text-xs truncate block hover:text-stone-800 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {link.originalUrl}
                  </a>
                </div>
              </div>

              {/* Short Link Action Bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl pl-3 pr-1 py-1 group/bar transition-colors hover:border-yellow-400/50 hover:bg-yellow-50/50">
                  <span className="text-stone-400 text-sm">link.ly/</span>
                  <span className="text-slate-900 font-mono text-sm font-bold ml-0.5">{link.shortCode}</span>
                  <div className="w-px h-4 bg-stone-200 mx-3"></div>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg text-stone-400 hover:text-slate-900 hover:bg-stone-200 transition-all active:scale-95" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
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
            <div className="flex flex-row md:flex-col items-end gap-6 justify-between border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{link.clicks}</div>
                <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">Clicks</div>
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
            <div className="mt-4 p-6 bg-stone-50 border-t border-stone-200 rounded-b-xl animate-fadeIn flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200">
                <QRCodeSVG value={fullShortUrl} size={120} fgColor={qrColor} />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-900 font-bold mb-2">QR Code Configuration</h4>
                <p className="text-sm text-stone-500 mb-4">Download or customize the color of your QR code.</p>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400 uppercase tracking-wider font-bold">Color</span>
                  <div className="flex gap-2">
                    {['#000000', '#4f46e5', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                      <button
                        key={c}
                        onClick={() => setQrColor(c)}
                        className={`w-8 h-8 rounded-full border border-stone-200 transition-transform hover:scale-110 ${qrColor === c ? 'ring-2 ring-stone-400 ring-offset-2 ring-offset-stone-50' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>


    </>
  );
};

export default LinkCard;