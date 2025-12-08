import React from 'react';
import { BioProfile, LinkData, BioThemeConfig } from '../../types';
import { ExternalLink, Star } from 'lucide-react';
import { BioWidget } from '../BioWidget';

interface BioTemplateProps {
    profile: BioProfile;
    links: LinkData[];
}

const CustomBioTemplate: React.FC<BioTemplateProps> = ({ profile, links }) => {
    const theme = profile.customTheme;

    if (!theme) return null;

    // Helper to get button classes based on style
    const getButtonClasses = () => {
        const base = "block w-full p-4 transition-all transform hover:-translate-y-1 active:translate-y-0";
        switch (theme.buttonStyle) {
            case 'pill': return `${base} rounded-full`;
            case 'square': return `${base} rounded-none`;
            case 'shadow': return `${base} rounded-lg shadow-lg hover:shadow-xl`;
            case 'hard-shadow': return `${base} rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]`;
            case 'outline': return `${base} rounded-lg border-2`;
            case 'rounded': default: return `${base} rounded-lg`;
        }
    };

    // Helper for background style
    const getBackgroundStyle = () => {
        if (theme.backgroundType === 'image') {
            return {
                backgroundImage: `url(${theme.backgroundValue})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            };
        }
        return { background: theme.backgroundValue };
    };

    // Helper for font family
    const getFontFamily = () => {
        switch (theme.font) {
            case 'roboto': return '"Roboto", sans-serif';
            case 'lora': return '"Lora", serif';
            case 'poppins': return '"Poppins", sans-serif';
            case 'space-mono': return '"Space Mono", monospace';
            case 'outfit': return '"Outfit", sans-serif';
            case 'inter': default: return '"Inter", sans-serif';
        }
    };

    return (
        <div
            className="min-h-screen w-full overflow-x-hidden"
            style={{
                ...getBackgroundStyle(),
                color: theme.textColor,
                fontFamily: getFontFamily()
            }}
        >
            {/* Overlay for readability if image background */}
            {theme.backgroundType === 'image' && (
                <div className="fixed inset-0 bg-black/30 pointer-events-none" />
            )}

            <div className="max-w-md mx-auto min-h-screen relative z-10 flex flex-col py-12 px-6">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-block mb-6 relative">
                        <div
                            className="w-32 h-32 overflow-hidden bg-white/10 backdrop-blur-sm"
                            style={{
                                borderRadius: theme.buttonStyle === 'pill' ? '50%' : theme.buttonStyle === 'square' ? '0' : '1rem',
                                border: `2px solid ${theme.textColor}`
                            }}
                        >
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                                    {profile.displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-2 tracking-tight">{profile.displayName}</h1>
                    <p className="opacity-80 font-medium inline-block px-3 py-1 rounded-full border border-current">
                        @{profile.handle}
                    </p>
                    {profile.bio && (
                        <p className="mt-4 text-lg font-medium leading-relaxed max-w-xs mx-auto opacity-90">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4 auto-rows-min">
                        {links.map((link) => {
                            const style = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

                            if (link.type !== 'link') {
                                return (
                                    <div key={link.id} className={`${style} overflow-hidden rounded-xl`}>
                                        <BioWidget link={link} />
                                    </div>
                                );
                            }

                            return (
                                <a
                                    key={link.id}
                                    href={`/r/${link.shortCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${getButtonClasses()} ${style}`}
                                    style={{
                                        backgroundColor: theme.buttonStyle === 'outline' ? 'transparent' : theme.buttonColor,
                                        color: theme.buttonTextColor,
                                        borderColor: theme.buttonStyle === 'outline' ? theme.buttonColor : 'black'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-lg">{link.title}</span>
                                        <ExternalLink className="w-4 h-4 opacity-70" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                        <Star className="w-4 h-4 fill-current" />
                        <span>Powered by Linkly</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomBioTemplate;
