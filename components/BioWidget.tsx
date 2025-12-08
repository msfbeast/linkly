
import React from 'react';
import { LinkData } from '../types';
import { MusicBlock } from './blocks/MusicBlock';
import { MapBlock } from './blocks/MapBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { SocialFeedBlock } from './blocks/SocialFeedBlock';

interface BioWidgetProps {
    link: LinkData;
}

export const BioWidget: React.FC<BioWidgetProps> = ({ link }) => {
    switch (link.type) {
        case 'music':
            return <MusicBlock url={link.metadata?.embedUrl || link.originalUrl} platform={link.metadata?.platform} />;
        case 'map':
            return <MapBlock lat={link.metadata?.lat} lng={link.metadata?.lng} address={link.metadata?.address} />;
        case 'video':
            return <VideoBlock videoId={link.metadata?.videoId} platform={link.metadata?.videoPlatform} />;
        case 'social_feed':
            return <SocialFeedBlock platform={link.metadata?.socialPlatform} username={link.metadata?.username} />;
        default:
            return null;
    }
};
