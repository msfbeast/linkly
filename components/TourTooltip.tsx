import React from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourTooltipProps {
    step: number;
    totalSteps: number;
    title: string;
    content: string;
    onNext: () => void;
    onSkip: () => void;
    onPrev: () => void;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    targetRect?: DOMRect;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
    step,
    totalSteps,
    title,
    content,
    onNext,
    onSkip,
    onPrev,
    placement = 'bottom',
    targetRect,
}) => {
    // Calculate position based on targetRect and placement
    const getPosition = () => {
        if (!targetRect) return {};

        const gap = 12;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        switch (placement) {
            case 'top':
                return {
                    left: targetRect.left + targetRect.width / 2 + scrollX,
                    top: targetRect.top - gap + scrollY,
                    transform: 'translate(-50%, -100%)',
                };
            case 'bottom':
                return {
                    left: targetRect.left + targetRect.width / 2 + scrollX,
                    top: targetRect.bottom + gap + scrollY,
                    transform: 'translate(-50%, 0)',
                };
            case 'left':
                return {
                    left: targetRect.left - gap + scrollX,
                    top: targetRect.top + targetRect.height / 2 + scrollY,
                    transform: 'translate(-100%, -50%)',
                };
            case 'right':
                return {
                    left: targetRect.right + gap + scrollX,
                    top: targetRect.top + targetRect.height / 2 + scrollY,
                    transform: 'translate(0, -50%)',
                };
            default:
                return {};
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: 'absolute',
                    zIndex: 10000,
                    ...getPosition(),
                }}
                className="w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-5"
            >
                {/* Arrow */}
                <div
                    className={`absolute w-4 h-4 bg-white border-stone-200 rotate-45 ${placement === 'top' ? 'bottom-[-9px] left-1/2 -translate-x-1/2 border-b border-r' :
                            placement === 'bottom' ? 'top-[-9px] left-1/2 -translate-x-1/2 border-t border-l' :
                                placement === 'left' ? 'right-[-9px] top-1/2 -translate-y-1/2 border-t border-r' :
                                    'left-[-9px] top-1/2 -translate-y-1/2 border-b border-l'
                        }`}
                />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                                Step {step} of {totalSteps}
                            </span>
                        </div>
                        <button
                            onClick={onSkip}
                            className="text-stone-400 hover:text-slate-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-stone-500 text-sm mb-4 leading-relaxed">{content}</p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                        <button
                            onClick={onPrev}
                            disabled={step === 1}
                            className={`text-sm font-medium ${step === 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-slate-900'
                                }`}
                        >
                            Back
                        </button>

                        <button
                            onClick={onNext}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {step === totalSteps ? (
                                <>
                                    Finish <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TourTooltip;
