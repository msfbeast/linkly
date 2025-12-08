import React from 'react';
import { LinkData, WidgetVariant } from '../types';
import { MusicBlock } from './blocks/MusicBlock';
import { MapBlock } from './blocks/MapBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { SocialFeedBlock } from './blocks/SocialFeedBlock';

interface BioWidgetProps {
    link: LinkData;
    variant?: WidgetVariant;
}

export const BioWidget: React.FC<BioWidgetProps> = ({ link, variant = 'default' }) => {
    const colSpan = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

    switch (link.type) {
        case 'music':
            return <MusicBlock url={link.metadata?.embedUrl || link.originalUrl} platform={link.metadata?.platform} variant={variant} className={colSpan} />;
        case 'map':
            return <MapBlock lat={link.metadata?.lat} lng={link.metadata?.lng} address={link.metadata?.address} variant={variant} className={colSpan} />;
        case 'video':
            return <VideoBlock videoId={link.metadata?.videoId} platform={link.metadata?.videoPlatform} variant={variant} className={colSpan} />;
        case 'social_feed':
            return <SocialFeedBlock platform={link.metadata?.socialPlatform} username={link.metadata?.username} variant={variant} className={colSpan} />;
        default:
            return null;
    }
};
