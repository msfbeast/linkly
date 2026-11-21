import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FREE_LINK_LIMIT } from '../utils/planLimits';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Shown when a free account has used all its links. Says only what Pro
 * actually adds over Free (see pages/Pricing.tsx); everything else is on
 * both plans.
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#18181A]/50" onClick={onClose} aria-hidden="true" />
            <div role="dialog" aria-modal="true" aria-labelledby="upgrade-title"
                className="relative w-full max-w-md rounded-3xl bg-[#FBFAF8] p-6 text-[#18181A] shadow-xl sm:p-8">
                <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#8C8981] hover:bg-[#F0EEEA] hover:text-[#18181A]">
                    <X className="h-4 w-4" />
                </button>
                <p className="font-mono text-[12px] text-[#C2410C]">{FREE_LINK_LIMIT} of {FREE_LINK_LIMIT} links used</p>
                <h2 id="upgrade-title" className="mt-2 text-[22px] font-medium tracking-tight">You've used all your free links</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5F5C56]">
                    Your existing links keep working. To make more, delete ones you no longer need, or move to Pro.
                </p>
                <ul className="mt-5 grid gap-2 rounded-2xl bg-[#F3F2EF] p-4 text-[14px]">
                    {['Unlimited links', '90 days of analytics'].map(item => (
                        <li key={item} className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#18181A] text-white"><Check className="h-3 w-3" /></span>
                            {item}
                        </li>
                    ))}
                    <li className="pl-[30px] text-[12px] text-[#8C8981]">Everything else you use now stays the same.</li>
                </ul>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => { onClose(); navigate('/pricing'); }}
                        className="flex-1 rounded-full bg-[#FF5A14] px-5 py-3 text-[14px] font-medium text-white hover:opacity-90">
                        See Pro
                    </button>
                    <button onClick={onClose} className="rounded-full bg-[#F0EEEA] px-5 py-3 text-[14px] text-[#18181A] hover:bg-[#E6E3DD]">
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
};
