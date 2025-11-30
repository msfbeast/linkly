import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TourTooltip from './TourTooltip';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

export interface TourStep {
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    path?: string; // If step requires navigation
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="create-link-button"]',
        title: '👋 Create your first link',
        content: 'Click here to shorten any URL and make it shareable instantly.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="link-card"]',
        title: '📊 Track your performance',
        content: 'Click on any link card to see detailed analytics like clicks, locations, and devices.',
        placement: 'right',
    },
    {
        target: '[data-tour="tag-filter"]',
        title: '🏷️ Organize with tags',
        content: 'Filter your links by tags to keep your dashboard organized as you grow.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="bio-nav"]',
        title: '🎨 Your link hub',
        content: 'Create a beautiful Bio Page to share all your important links in one place.',
        placement: 'right',
    },
];

const OnboardingTour: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Check if tour should start
    useEffect(() => {
        if (user && !user.preferences?.onboarding_completed && !user.preferences?.onboarding_skipped) {
            // Small delay to ensure UI is loaded
            const timer = setTimeout(() => {
                setIsActive(true);
                setCurrentStep(user.preferences?.onboarding_step || 0);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Update target rect when step changes or window resizes
    useEffect(() => {
        if (!isActive) return;

        const updateRect = () => {
            const step = TOUR_STEPS[currentStep];
            const element = document.querySelector(step.target);

            if (element) {
                setTargetRect(element.getBoundingClientRect());
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found, maybe wait a bit or skip step?
                console.warn(`Tour target not found: ${step.target}`);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
        };
    }, [currentStep, isActive]);

    const handleNext = async () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            // Save progress
            if (user) {
                await supabaseAdapter.updateProfile(user.id, {
                    preferences: {
                        ...user.preferences,
                        onboarding_step: nextStep
                    }
                });
            }
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = async () => {
        setIsActive(false);
        if (user) {
            await supabaseAdapter.updateProfile(user.id, {
                preferences: {
                    ...user.preferences,
                    onboarding_skipped: true
                }
            });
        }
    };

    const handleComplete = async () => {
        setIsActive(false);

        // Confetti celebration
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FCD34D', '#F59E0B', '#1E293B']
        });

        if (user) {
            await supabaseAdapter.updateProfile(user.id, {
                preferences: {
                    ...user.preferences,
                    onboarding_completed: true,
                    onboarding_step: TOUR_STEPS.length
                }
            });
        }
    };

    if (!isActive || !targetRect) return null;

    const step = TOUR_STEPS[currentStep];

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Dark Overlay with cutout */}
            <div className="absolute inset-0 bg-black/50 transition-colors duration-500">
                <div
                    style={{
                        position: 'absolute',
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease-in-out',
                    }}
                    className="pointer-events-none"
                />
            </div>

            {/* Spotlight Glow */}
            <div
                style={{
                    position: 'absolute',
                    left: targetRect.left - 8,
                    top: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    borderRadius: '12px',
                    border: '2px solid rgba(252, 211, 77, 0.5)',
                    boxShadow: '0 0 20px rgba(252, 211, 77, 0.3)',
                    transition: 'all 0.3s ease-in-out',
                }}
                className="pointer-events-none animate-pulse"
            />

            {/* Tooltip (Interactive) */}
            <div className="pointer-events-auto">
                <TourTooltip
                    step={currentStep + 1}
                    totalSteps={TOUR_STEPS.length}
                    title={step.title}
                    content={step.content}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onSkip={handleSkip}
                    placement={step.placement}
                    targetRect={targetRect}
                />
            </div>
        </div>,
        document.body
    );
};

export default OnboardingTour;
