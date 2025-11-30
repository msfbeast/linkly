import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, User, Image as ImageIcon, Link as LinkIcon, Share2, Palette, Globe } from 'lucide-react';
import { LinkData, BioProfile } from '../types';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SetupChecklistProps {
    links: LinkData[];
    onComplete?: () => void;
}

interface Step {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    isComplete: boolean;
    actionLabel: string;
    onAction: () => void;
}

const SetupChecklist: React.FC<SetupChecklistProps> = ({ links, onComplete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bioProfile, setBioProfile] = useState<BioProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);

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

    // Determine completion status
    const hasBio = !!(bioProfile?.displayName && bioProfile?.bio);
    const hasAvatar = !!bioProfile?.avatarUrl;
    const hasLinks = links.length > 0;
    const hasCustomDesign = bioProfile?.theme !== 'light' && bioProfile?.theme !== 'dark'; // Assuming 'light'/'dark' are defaults
    const hasShared = links.reduce((acc, link) => acc + link.clicks, 0) > 0; // Inferred from clicks

    const steps: Step[] = [
        {
            id: 'bio',
            title: 'Add your name and bio',
            description: 'This will be the first thing visitors see when they land on your page.',
            icon: User,
            isComplete: hasBio,
            actionLabel: 'Add name and bio',
            onAction: () => navigate('/bio'),
        },
        {
            id: 'avatar',
            title: 'Add your profile image',
            description: 'Upload a photo or logo to make your profile instantly recognizable.',
            icon: ImageIcon,
            isComplete: hasAvatar,
            actionLabel: 'Upload image',
            onAction: () => navigate('/bio'),
        },
        {
            id: 'links',
            title: 'Add your first link',
            description: 'Add a link to your website, store, or latest content.',
            icon: LinkIcon,
            isComplete: hasLinks,
            actionLabel: 'Create Link',
            onAction: () => navigate('/links'), // Or open modal if passed
        },
        {
            id: 'design',
            title: 'Customize your design',
            description: 'Choose a theme that matches your brand and style.',
            icon: Palette,
            isComplete: hasCustomDesign,
            actionLabel: 'Pick a theme',
            onAction: () => navigate('/bio'),
        },
        {
            id: 'share',
            title: 'Share your Linktree',
            description: 'Share your unique link on your social profiles to start getting traffic.',
            icon: Share2,
            isComplete: hasShared,
            actionLabel: 'Copy Link',
            onAction: () => {
                if (bioProfile?.handle) {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${bioProfile.handle}`);
                    alert('Link copied to clipboard!');
                } else {
                    navigate('/bio');
                }
            },
        },
    ];

    // Auto-expand the first incomplete step
    useEffect(() => {
        if (loading) return;
        const firstIncomplete = steps.find(s => !s.isComplete);
        if (firstIncomplete) {
            setExpandedStep(firstIncomplete.id);
        }
    }, [loading]); // Run once after loading finishes

    if (!user || loading) return null;
    if (!isVisible) return null;

    const completedCount = steps.filter(s => s.isComplete).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const isAllComplete = completedCount === steps.length;

    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="#E7E5E4"
                                strokeWidth="4"
                                fill="none"
                            />
                            <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="#8B5CF6" // Violet-500
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={126}
                                strokeDashoffset={126 - (126 * progress) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-600">
                            {progress}%
                        </span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Your setup checklist</h2>
                        <p className="text-sm text-stone-500">{completedCount} of {steps.length} complete</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-stone-400 hover:text-slate-900 transition-colors"
                >
                    <span className="sr-only">Dismiss</span>
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-2">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`border rounded-xl transition-all duration-300 overflow-hidden ${step.isComplete ? 'border-stone-100 bg-stone-50/50' :
                            expandedStep === step.id ? 'border-violet-100 bg-violet-50/10' : 'border-stone-200'
                            }`}
                    >
                        <button
                            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                            className="w-full flex items-center justify-between p-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${step.isComplete
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-stone-300 text-transparent'
                                    }`}>
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className={`font-medium ${step.isComplete ? 'text-stone-500 line-through' : 'text-slate-900'}`}>
                                    {step.title}
                                </span>
                            </div>
                            {expandedStep === step.id ? (
                                <ChevronUp className="w-4 h-4 text-stone-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-stone-400" />
                            )}
                        </button>

                        <AnimatePresence>
                            {expandedStep === step.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="px-4 pb-4 pl-[3.25rem]">
                                        <p className="text-sm text-stone-600 mb-4">{step.description}</p>
                                        <button
                                            onClick={step.onAction}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-violet-600/20"
                                        >
                                            {step.actionLabel}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {isAllComplete && (
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Check className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-green-800">All set!</h3>
                        <p className="text-xs text-green-600">You've completed the setup checklist.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetupChecklist;
