import React, { Suspense } from 'react';
import { LinkData, WidgetVariant, BioProfile } from '../types';
import { WidgetSkeleton } from './WidgetSkeleton';

import { WidgetErrorBoundary } from './WidgetErrorBoundary';

// Lazy Load Widgets
// Handle Named Exports
const MusicBlock = React.lazy(() => import('./blocks/MusicBlock').then(m => ({ default: m.MusicBlock })));
const MapBlock = React.lazy(() => import('./blocks/MapBlock').then(m => ({ default: m.MapBlock })));
const VideoBlock = React.lazy(() => import('./blocks/VideoBlock').then(m => ({ default: m.VideoBlock })));
const SocialFeedBlock = React.lazy(() => import('./blocks/SocialFeedBlock').then(m => ({ default: m.SocialFeedBlock })));
const PollBlock = React.lazy(() => import('./blocks/PollBlock').then(m => ({ default: m.PollBlock })));
const QnaBlock = React.lazy(() => import('./blocks/QnaBlock').then(m => ({ default: m.QnaBlock })));

// Handle Default Exports
const TipJarBlock = React.lazy(() => import('./blocks/TipJarBlock'));

interface BioWidgetProps {
    link: LinkData;
    variant?: WidgetVariant;
    profile?: BioProfile;
}

export const BioWidget: React.FC<BioWidgetProps> = ({ link, variant = 'default', profile }) => {
    const colSpan = link.layoutConfig?.w === 2 ? 'col-span-2' : 'col-span-1';

    const renderWidget = () => {
        switch (link.type) {
            case 'music':
                return <MusicBlock url={link.metadata?.embedUrl || link.originalUrl} platform={link.metadata?.platform} variant={variant} className={colSpan} />;
            case 'map':
                return <MapBlock lat={link.metadata?.lat} lng={link.metadata?.lng} address={link.metadata?.address} variant={variant} className={colSpan} />;
            case 'video':
                return <VideoBlock videoId={link.metadata?.videoId} platform={link.metadata?.videoPlatform} variant={variant} className={colSpan} />;
            case 'social_feed':
                return <SocialFeedBlock platform={link.metadata?.socialPlatform} username={link.metadata?.username} variant={variant} className={colSpan} />;
            case 'poll':
                return <PollBlock question={link.metadata?.question} options={link.metadata?.options} variant={variant} className={colSpan} />;
            case 'qna':
                return <QnaBlock title={link.metadata?.title} userId={link.metadata?.userId} variant={variant} className={colSpan} />;
            case 'tip_jar':
                return profile ? <TipJarBlock link={link} profile={profile} /> : null;
            default:
                return null;
        }
    };

    return (
        <Suspense fallback={<WidgetSkeleton />}>
            <WidgetErrorBoundary>
                {renderWidget()}
            </WidgetErrorBoundary>
        </Suspense>
    );
};
