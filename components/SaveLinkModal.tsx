import React from 'react';
import { X, Sparkles, TrendingUp, Lock, Zap } from 'lucide-react';
import { LinkData } from '../types';

interface SaveLinkModalProps {
    link: LinkData;
    isOpen: boolean;
    onClose: () => void;
    onSignup: () => void;
}

const SaveLinkModal: React.FC<SaveLinkModalProps> = ({ link, isOpen, onClose, onSignup }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Save your link & get analytics?
                    </h2>
                    <p className="text-stone-500">
                        Your link expires in <span className="font-bold text-yellow-600">7 days</span>
                    </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Keep your link forever</h3>
                            <p className="text-stone-500 text-xs">No expiration, unlimited clicks</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Track clicks & analytics</h3>
                            <p className="text-stone-500 text-xs">See devices, locations, referrers</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">Create unlimited links</h3>
                            <p className="text-stone-500 text-xs">Build your link hub</p>
                        </div>
                    </div>
                </div>

                {/* Current stats */}
                {link.clicks > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-center text-yellow-800 font-medium">
                            Your link already got <span className="font-bold">{link.clicks} clicks</span>! 🎉
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onSignup}
                        className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-colors shadow-lg shadow-yellow-400/20"
                    >
                        Sign Up (Free)
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 text-stone-500 hover:text-slate-900 font-medium rounded-xl transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>

                <p className="text-center text-stone-400 text-xs mt-4">
                    Free forever. No credit card required.
                </p>
            </div>
        </div>
    );
};

export default SaveLinkModal;
