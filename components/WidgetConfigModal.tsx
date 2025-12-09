
import React, { useState, useEffect } from 'react';
import { X, Music, MapPin, Video, BarChart2, MessageSquare, Check } from 'lucide-react';
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

        if (type === 'music') {
            if (!inputValue.includes('spotify') && !inputValue.includes('apple')) {
                setError('Please enter a valid Spotify or Apple Music URL');
                return;
            }
            metadata = {
                platform: inputValue.includes('apple') ? 'apple' : 'spotify',
                embedUrl: inputValue
            };
        } else if (type === 'video') {
            const isYoutube = inputValue.includes('youtube') || inputValue.includes('youtu.be');
            const isVimeo = inputValue.includes('vimeo');

            if (!isYoutube && !isVimeo) {
                setError('Please enter a valid YouTube or Vimeo URL');
                return;
            }

            let videoId = '';
            if (isYoutube) {
                const url = new URL(inputValue);
                videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
            } else if (isVimeo) {
                videoId = inputValue.split('/').pop() || '';
            }

            metadata = {
                videoPlatform: isVimeo ? 'vimeo' : 'youtube',
                videoId
            };
        } else if (type === 'map') {
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
        } else if (type === 'poll') {
            if (!inputValue) {
                setError('Question is required');
                return;
            }
            metadata = {
                question: inputValue,
                options: [
                    { id: '1', text: 'Yes', votes: 0 },
                    { id: '2', text: 'No', votes: 0 }
                ]
            };
        } else if (type === 'qna') {
            if (!inputValue) {
                setError('Title is required');
                return;
            }
            metadata = { title: inputValue };
        }

        onSubmit(metadata);
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'music': return <Music className="w-6 h-6 text-pink-500" />;
            case 'map': return <MapPin className="w-6 h-6 text-green-500" />;
            case 'video': return <Video className="w-6 h-6 text-red-500" />;
            case 'poll': return <BarChart2 className="w-6 h-6 text-orange-500" />;
            case 'qna': return <MessageSquare className="w-6 h-6 text-purple-500" />;
            default: return null;
        }
    };

    const getLabels = () => {
        switch (type) {
            case 'music': return { title: 'Add Music', label: 'Spotify or Apple Music URL', placeholder: 'https://open.spotify.com/track/...' };
            case 'video': return { title: 'Add Video', label: 'YouTube or Vimeo URL', placeholder: 'https://youtube.com/watch?v=...' };
            case 'map': return { title: 'Add Location', label: 'Address or Place Name', placeholder: 'New York City, NY' };
            case 'poll': return { title: 'Create Poll', label: 'Question', placeholder: 'What should I post next?' };
            case 'qna': return { title: 'Q&A Section', label: 'Section Title', placeholder: 'Ask me anything' };
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
