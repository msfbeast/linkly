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
        <div className="bg-white border border-stone-200 rounded-3xl p-8 mb-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative w-14 h-14">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="#F3F4F6"
                                strokeWidth="6"
                                fill="none"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="#8B5CF6" // Violet-500
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={151}
                                strokeDashoffset={151 - (151 * progress) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-violet-600">
                            {progress}%
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Your setup checklist</h2>
                        <p className="text-sm text-stone-500 font-medium">{completedCount} of {steps.length} complete</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-stone-400 hover:text-slate-900 transition-colors p-2 hover:bg-stone-100 rounded-full"
                >
                    <span className="sr-only">Dismiss</span>
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`border rounded-2xl transition-all duration-300 overflow-hidden ${step.isComplete ? 'border-stone-100 bg-stone-50/30' :
                            expandedStep === step.id ? 'border-stone-200 bg-white shadow-sm' : 'border-stone-200 bg-white'
                            }`}
                    >
                        <button
                            onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                            className="w-full flex items-center justify-between p-5 text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${step.isComplete
                                    ? 'bg-green-500 border-green-500 text-white scale-110'
                                    : 'border-stone-300 text-transparent group-hover:border-stone-400'
                                    }`}>
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                                <span className={`font-bold text-base ${step.isComplete ? 'text-stone-400 line-through decoration-stone-300' : 'text-slate-900'}`}>
                                    {step.title}
                                </span>
                            </div>
                            {expandedStep === step.id ? (
                                <ChevronUp className="w-5 h-5 text-stone-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                            )}
                        </button>

                        <AnimatePresence>
                            {expandedStep === step.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                >
                                    <div className="px-5 pb-6 pl-[3.5rem]">
                                        <p className="text-stone-500 mb-5 leading-relaxed">{step.description}</p>
                                        <button
                                            onClick={step.onAction}
                                            className="px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-bold rounded-full transition-all shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0"
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
                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                        <Check className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-green-800">All set!</h3>
                        <p className="text-sm text-green-600">You've completed the setup checklist.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SetupChecklist;
