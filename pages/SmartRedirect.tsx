import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';

const SmartRedirect: React.FC = () => {
    const { url } = useParams<{ url: string }>();
    const decodedUrl = url ? decodeURIComponent(url) : '';
    const [status, setStatus] = useState('Opening...');

    useEffect(() => {
        if (!decodedUrl) return;

        // Attempt to open automatically
        const openApp = () => {
            // For Google Drive specifically, we can try the intent scheme if needed,
            // but usually the https link is intercepted by the OS if the app is installed.
            // However, in-app browsers (IG/FB) block this.

            // Strategy:
            // 1. Try to open the URL directly (OS should intercept)
            window.location.href = decodedUrl;

            // 2. Fallback logic is handled by the user clicking the button if the above fails
            // or if the browser stays on this page.
        };

        // Small delay to render the UI first
        const timer = setTimeout(() => {
            openApp();
            setStatus('If the app didn\'t open, click below:');
        }, 1000);

        return () => clearTimeout(timer);
    }, [decodedUrl]);

    if (!decodedUrl) return <div>Invalid Link</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <ExternalLink className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-slate-900">Opening Link...</h1>
                    <p className="text-slate-500">{status}</p>
                </div>

                <a
                    href={decodedUrl}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                    Open App
                </a>

                <p className="text-xs text-slate-400">
                    Powered by Linkly
                </p>
            </div>
        </div>
    );
};

export default SmartRedirect;
