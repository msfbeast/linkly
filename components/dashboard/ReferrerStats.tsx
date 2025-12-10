import React from 'react';
import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';

interface ReferrerData {
    name: string;
    value: number;
}

interface ReferrerStatsProps {
    data: ReferrerData[];
}

const REFERRER_COLORS: Record<string, string> = {
    'direct': '#10B981',      // Green for direct
    'google': '#4285F4',      // Google blue
    'twitter': '#1DA1F2',     // Twitter blue
    'facebook': '#4267B2',    // Facebook blue
    'instagram': '#E4405F',   // Instagram pink
    'linkedin': '#0077B5',    // LinkedIn blue
    'youtube': '#FF0000',     // YouTube red
    'tiktok': '#000000',      // TikTok black
    'reddit': '#FF4500',      // Reddit orange
    'whatsapp': '#25D366',    // WhatsApp green
};

const getColorForReferrer = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [key, color] of Object.entries(REFERRER_COLORS)) {
        if (lower.includes(key)) return color;
    }
    return '#F59E0B'; // Default amber
};

const formatReferrerName = (name: string): string => {
    if (name === 'direct' || name === 'Direct') return '🔗 Direct / Email';
    if (name.includes('google')) return '🔍 Google';
    if (name.includes('twitter') || name.includes('t.co')) return '𝕏 Twitter/X';
    if (name.includes('facebook') || name.includes('fb.')) return '📘 Facebook';
    if (name.includes('instagram')) return '📸 Instagram';
    if (name.includes('linkedin')) return '💼 LinkedIn';
    if (name.includes('youtube')) return '▶️ YouTube';
    if (name.includes('tiktok')) return '🎵 TikTok';
    if (name.includes('reddit')) return '🔴 Reddit';
    if (name.includes('whatsapp')) return '💬 WhatsApp';
    // Truncate long URLs
    if (name.length > 20) return name.substring(0, 20) + '...';
    return name;
};

export const ReferrerStats: React.FC<ReferrerStatsProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white rounded-[2rem] p-6 border border-stone-200 shadow-sm h-full relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 z-10">
                Traffic Sources
            </h3>
            <p className="text-xs text-stone-400 mb-4">Where your visitors come from</p>

            <div className="space-y-3">
                {data.slice(0, 5).map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    const color = getColorForReferrer(item.name);
                    return (
                        <div key={item.name} className="relative">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-slate-700 truncate max-w-[140px]">
                                    {formatReferrerName(item.name)}
                                </span>
                                <span className="text-stone-500 text-xs font-bold">
                                    {item.value.toLocaleString()} ({Math.round(percentage)}%)
                                </span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && (
                    <div className="text-center text-stone-400 py-8">
                        <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No referrer data yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};
