import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { safeWebUrl } from '../utils/safeUrl';
import PublicCard from '../components/PublicCard';

/** /open/:url — opens a web link from inside an in-app browser, with a button if that's blocked. */
const SmartRedirect: React.FC = () => {
    const { url } = useParams<{ url: string }>();
    // Only web links: this page is public and takes the URL from its own
    // path, so without this /open/javascript:... ran script on our origin.
    let target = '';
    try {
        target = (url && safeWebUrl(decodeURIComponent(url))) || '';
    } catch {
        target = ''; // malformed %-encoding
    }
    const [tried, setTried] = useState(false);

    useEffect(() => {
        if (!target) return;
        const timer = setTimeout(() => { window.location.href = target; setTried(true); }, 600);
        return () => clearTimeout(timer);
    }, [target]);

    if (!target) {
        return (
            <PublicCard>
                <h1 className="text-[22px] font-medium tracking-tight">Nothing to open</h1>
                <p className="mt-2 text-[14px] text-[#5F5C56]">This address doesn't contain a web link.</p>
                <a href="/" className="mt-5 inline-block text-[13px] underline underline-offset-2">Go to Gather</a>
            </PublicCard>
        );
    }

    return (
        <PublicCard>
            <div className="flex items-center gap-3" role="status">
                {!tried && <Loader2 className="h-5 w-5 animate-spin text-[#FF5A14]" />}
                <h1 className="text-[18px] font-medium">{tried ? 'Didn\'t open?' : 'Opening link…'}</h1>
            </div>
            <p className="mt-3 truncate rounded-xl bg-[#F0EEEA] px-3 py-2 font-mono text-[12px] text-[#8C8981]">{target}</p>
            <a href={target} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#FF5A14] py-3.5 text-[14px] font-medium text-white hover:opacity-90">
                Open it <ArrowRight className="h-4 w-4" />
            </a>
        </PublicCard>
    );
};

export default SmartRedirect;
