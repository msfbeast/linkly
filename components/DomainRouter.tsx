import React, { useEffect, useState } from 'react';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import BioView from '../pages/BioView';
import LoadingFallback from './LoadingFallback';

interface DomainRouterProps {
    children: React.ReactNode;
}

const DomainRouter: React.FC<DomainRouterProps> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [handle, setHandle] = useState<string | null>(null);
    const [isCustomDomain, setIsCustomDomain] = useState(false);

    useEffect(() => {
        const checkDomain = async () => {
            const hostname = window.location.hostname;

            // Allow list for main app domains
            // TODO: Add env var for main domain
            const allowedDomains = ['localhost', 'linkly.ai', 'linkly-ai.vercel.app', 'gather-link.vercel.app'];
            const isAllowed = allowedDomains.some(d => hostname.includes(d));

            if (isAllowed) {
                setLoading(false);
                return;
            }

            console.log('[DomainRouter] Checking custom domain:', hostname);
            setIsCustomDomain(true);

            try {
                const result = await supabaseAdapter.resolveDomain(hostname);
                if (result && result.handle) {
                    setHandle(result.handle);
                } else {
                    console.warn('[DomainRouter] Domain not found:', hostname);
                }
            } catch (error) {
                console.error('[DomainRouter] Failed to resolve domain:', error);
            } finally {
                setLoading(false);
            }
        };

        checkDomain();
    }, []);

    if (loading) {
        return <LoadingFallback />;
    }

    if (isCustomDomain && handle) {
        // Override routing and show BioView directly
        // We pass the handle via prop or let BioView fetch from URL? 
        // BioView usually takes params from url /p/:handle
        // But here URL is root /. 
        // We need to modify BioView to accept handle prop optionally.
        return <BioView handle={handle} />;
    }

    if (isCustomDomain && !handle) {
        // 404 for Custom Domain
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Domain Not Connected</h1>
                    <p className="text-gray-600">This domain is pointed to Linkly but not connected to a profile.</p>
                </div>
            </div>
        )
    }

    // Normal App Routing
    return <>{children}</>;
};

export default DomainRouter;
