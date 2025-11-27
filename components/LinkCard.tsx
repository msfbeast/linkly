import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, ExternalLink, BarChart2, Share2, Trash2, Calendar, MousePointer2, Loader2, Twitter, Smartphone, X, Globe, Pencil, Lock, MoreHorizontal } from 'lucide-react';
import { LinkData } from '../types';
import { generateSocialPost } from '../services/geminiService';
import { ClicksOverTime, DeviceStats, processLinkHistory } from './Charts';

interface LinkCardProps {
  link: LinkData;
  onDelete: (id: string) => void;
  onEdit: (link: LinkData) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onDelete, onEdit }) => {
  const [showQr, setShowQr] = useState(false);
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

  const { timeData, deviceData, osData } = processLinkHistory(link.clickHistory);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        whileHover={{ scale: 1.01 }}
        className="bg-sparks-card border border-white/5 rounded-2xl p-1 transition-all hover:bg-white/5 group relative mb-4"
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                {/* Status Badges */}
                {link.password && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Password Protected">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                {link.smartRedirects && (link.smartRedirects.ios || link.smartRedirects.android) && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Smart Redirects">
                    <Smartphone className="w-3 h-3" />
                  </span>
                )}
                {link.geoRedirects && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Geo Targeting">
                    <Globe className="w-3 h-3" />
                  </span>
                )}

                {link.aiAnalysis?.category && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                    {link.aiAnalysis.category}
                  </span>
                )}

                <span className="text-slate-500 text-xs flex items-center gap-1 ml-auto md:ml-0">
                  <Calendar className="w-3 h-3" />
                  {new Date(link.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {link.title}
                  </h3>
                  <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 text-xs truncate block hover:text-slate-300 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {link.originalUrl}
                  </a>
                </div>
              </div>

              {/* Short Link Action Bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center bg-slate-900/50 border border-indigo-500/20 rounded-xl pl-3 pr-1 py-1 group/bar transition-colors hover:border-indigo-500/40 hover:bg-slate-900">
                  <span className="text-slate-500 text-sm">link.ly/</span>
                  <span className="text-indigo-400 font-mono text-sm font-semibold ml-0.5">{link.shortCode}</span>
                  <div className="w-px h-4 bg-white/10 mx-3"></div>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setShowAnalytics(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" title="Analytics">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowQr(!showQr)} className={`p-2 rounded-lg transition-all ${showQr ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="QR Code">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-row md:flex-col items-end gap-6 justify-between border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-white tracking-tight">{link.clicks}</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Clicks</div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(link)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGeneratePost}
                  disabled={isGeneratingPost}
                  className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all relative"
                  title="AI Tweet"
                >
                  {isGeneratingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4" />}
                  {generatedPost && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-sparks-card border border-white/5 rounded-xl shadow-xl z-50 text-left">
                      <p className="text-xs text-sparks-text-muted mb-2 whitespace-pre-wrap font-sans leading-relaxed">{generatedPost}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(generatedPost); }}
                        className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-1.5 rounded-md w-full hover:bg-sky-500/30 font-medium transition-colors"
                      >
                        Copy Tweet
                      </button>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onDelete(link.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable QR Section */}
          {showQr && (
            <div className="mt-4 p-6 bg-slate-950/50 border-t border-white/5 rounded-b-xl animate-fadeIn flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/20">
                <QRCodeSVG value={fullShortUrl} size={120} fgColor={qrColor} />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">QR Code Configuration</h4>
                <p className="text-sm text-slate-500 mb-4">Download or customize the color of your QR code.</p>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Color</span>
                  <div className="flex gap-2">
                    {['#000000', '#4f46e5', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                      <button
                        key={c}
                        onClick={() => setQrColor(c)}
                        className={`w-8 h-8 rounded-full border border-slate-700 transition-transform hover:scale-110 ${qrColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
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

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalytics(false)} />
          <div className="relative bg-sparks-card border border-white/5 w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">Analytics Report</h3>
                <p className="text-sm text-slate-400 mt-1">{link.title}</p>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-indigo-400" /> Click Trend
                  </h4>
                  <ClicksOverTime data={timeData} />
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4">Device Split</h4>
                    <DeviceStats data={deviceData} />
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4">OS Breakdown</h4>
                    <div className="space-y-3">
                      {osData.map((os, i) => (
                        <div key={i} className="flex justify-between items-center text-sm group">
                          <span className="text-slate-400 flex items-center gap-2 group-hover:text-slate-200 transition-colors">
                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: os.color, color: os.color }} />
                            {os.name}
                          </span>
                          <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded text-xs">{os.value}</span>
                        </div>
                      ))}
                      {osData.length === 0 && <p className="text-xs text-slate-500">No data available</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-6">Recent Activity Log</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-white/5 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg font-semibold tracking-wider">Time</th>
                        <th className="px-4 py-3 font-semibold tracking-wider">Device</th>
                        <th className="px-4 py-3 font-semibold tracking-wider">OS</th>
                        <th className="px-4 py-3 font-semibold tracking-wider">Country</th>
                        <th className="px-4 py-3 rounded-r-lg font-semibold tracking-wider">Referrer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {link.clickHistory?.slice().reverse().slice(0, 10).map((click, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-slate-300">{new Date(click.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="px-4 py-3">{click.device}</td>
                          <td className="px-4 py-3">{click.os}</td>
                          <td className="px-4 py-3">
                            {click.country ? <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/20">{click.country}</span> : '-'}
                          </td>
                          <td className="px-4 py-3 truncate max-w-[200px] text-xs font-mono opacity-70">{click.referrer}</td>
                        </tr>
                      ))}
                      {(!link.clickHistory || link.clickHistory.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-600 italic">No clicks recorded yet. Share your link to start tracking!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LinkCard;