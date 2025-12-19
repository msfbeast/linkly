import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { LinkData, BioProfile } from '../types';

interface SetupWidgetProps {
    links: LinkData[];
}

const SetupWidget: React.FC<SetupWidgetProps> = ({ links }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bioProfile, setBioProfile] = useState<BioProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBioProfile = async () => {
            if (!user) return;
            try {
                const profiles = await supabaseAdapter.getBioProfiles(user.id);
                if (profiles && profiles.length > 0) {
                    setBioProfile(profiles[0]);
                }
            } catch (error) {
                console.error('Failed to load bio profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadBioProfile();
    }, [user]);

    if (!user || loading) return null;

    // Determine completion status
    const hasBio = !!(bioProfile?.displayName && bioProfile?.bio);
    const hasAvatar = !!bioProfile?.avatarUrl;
    const hasLinks = links.length > 0;
    const hasCustomDesign = (bioProfile?.theme as string) !== 'light' && (bioProfile?.theme as string) !== 'dark';
    const hasShared = links.reduce((acc, link) => acc + link.clicks, 0) > 0;

    const steps = [
        { id: 'bio', isComplete: hasBio },
        { id: 'avatar', isComplete: hasAvatar },
        { id: 'links', isComplete: hasLinks },
        { id: 'design', isComplete: hasCustomDesign },
        { id: 'share', isComplete: hasShared },
    ];

    const completedCount = steps.filter(s => s.isComplete).length;
    const totalSteps = steps.length;
    const progress = Math.round((completedCount / totalSteps) * 100);

    // If all complete, maybe don't show the widget? Or show a "Complete" state.
    // For now, we'll keep it visible as a status indicator.

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-100 sticky top-24">
            {/* Progress Ring */}
            <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#E9D5FF" // Light Purple
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#8B5CF6" // Violet-500
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={251}
                            strokeDashoffset={251 - (251 * progress) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-violet-600">{progress}%</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Your setup checklist</h3>
                <p className="text-stone-500 font-medium">{completedCount} of {totalSteps} complete</p>
            </div>

            {/* Action Button */}
            <button
                onClick={() => navigate('/bio')}
                className="w-full py-3.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
                Finish setup
            </button>
        </div>
    );
};

export default SetupWidget;
