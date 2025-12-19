
import React, { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { BlockType } from './BlockGalleryModal';

interface WidgetConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: BlockType | null;
    onSubmit: (data: any) => void;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({ isOpen, onClose, type, onSubmit }) => {
    const [inputValue, setInputValue] = useState('');
    const [secondaryValue, setSecondaryValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setInputValue('');
        setSecondaryValue('');
        setError('');
    }, [type, isOpen]);

    if (!isOpen || !type) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let metadata = {};

        if (type === 'map') {
            if (inputValue.length < 3) {
                setError('Please enter a valid location');
                return;
            }
            // Simple mock for now, ideally would use Places API
            metadata = {
                address: inputValue,
                lat: 40.7128, // Default fallback
                lng: -74.0060
            };
        }

        onSubmit(metadata);
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'map': return <MapPin className="w-6 h-6 text-green-500" />;
            default: return null;
        }
    };

    const getLabels = () => {
        switch (type) {
            case 'map': return { title: 'Add Location', label: 'Address or Place Name', placeholder: 'New York City, NY' };
            default: return { title: 'Configure Widget', label: 'URL', placeholder: 'https://...' };
        }
    };

    const labels = getLabels();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scaleIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-stone-800 rounded-full border border-stone-700">
                        {getIcon()}
                    </div>
                    <h2 className="text-xl font-bold text-white">{labels.title}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-1.5 ml-1">
                            {labels.label}
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={labels.placeholder}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-700 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-stone-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Check className="w-4 h-4" />
                            Add Widget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
