import React, { useState } from 'react';
import { Coffee, Coins, CreditCard, Heart, Check, X } from 'lucide-react';
import { LinkData, BioProfile } from '../../types';
import { toast } from 'sonner';
import { triggerConfetti } from '../../utils/confetti';

interface TipJarBlockProps {
    link: LinkData;
    profile: BioProfile;
    previewMode?: boolean;
}

const TipJarBlock: React.FC<TipJarBlockProps> = ({ link, profile, previewMode }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Default values or overrides from link metadata
    const config = profile.monetization || {};
    const amounts = [1, 3, 5, 10]; // Default amounts
    const currency = config.currency || 'USD';
    const label = link.title || 'Support my work';

    const handleTipClick = (amount: number) => {
        setSelectedAmount(amount);
        setIsProcessing(true);

        // Simulate Payment Process
        setTimeout(() => {
            setIsProcessing(false);
            setShowModal(false);
            toast.success(`Sent ${currency === 'USD' ? '$' : ''}${amount} tip! 🎉`);
            triggerConfetti();
        }, 1500);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all rounded-2xl p-4 flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                        <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div className="text-left leading-tight">
                        <span className="block font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{label}</span>
                        <span className="text-xs text-stone-500 font-medium">Accepting tips via {config.solWallet ? 'Solana' : 'PayPal'}</span>
                    </div>
                </div>
                <div className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold group-hover:bg-amber-50 group-hover:text-amber-600">
                    Tip
                </div>
            </button>

            {/* Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative animate-scaleIn">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-slate-900 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4 text-amber-500 border-4 border-white shadow-lg">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Buy a coffee for {profile.displayName}</h3>
                            <p className="text-sm text-stone-500 mt-1">100% of the tip goes to the creator.</p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {amounts.map(amt => (
                                <button
                                    key={amt}
                                    onClick={() => handleTipClick(amt)}
                                    className={`py-3 rounded-xl border-2 font-bold transition-all ${selectedAmount === amt
                                        ? 'border-amber-500 bg-amber-50 text-amber-600'
                                        : 'border-stone-100 hover:border-amber-200 text-slate-700 bg-stone-50'
                                        }`}
                                >
                                    {currency === 'USD' ? '$' : ''}{amt}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {isProcessing ? (
                                <button disabled className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 opacity-80 cursor-wait">
                                    <Loader className="w-4 h-4 animate-spin" /> Processing...
                                </button>
                            ) : (
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                                    Choose Amount
                                </button>
                            )}
                            <p className="text-[10px] text-center text-stone-400 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-green-500" /> Secure payment via Wallet/PayPal
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const Loader = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default TipJarBlock;
