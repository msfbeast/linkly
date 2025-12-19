import React, { Suspense } from 'react';
import { LinkData, WidgetVariant, BioProfile } from '../types';
import { WidgetSkeleton } from './WidgetSkeleton';

import { WidgetErrorBoundary } from './WidgetErrorBoundary';

// Lazy Load Widgets
// Handle Named Exports
const MapBlock = React.lazy(() => import('./blocks/MapBlock').then(m => ({ default: m.MapBlock })));
const QRCodeBlock = React.lazy(() => import('./blocks/QRCodeBlock').then(m => ({ default: m.QRCodeBlock })));

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
            case 'map':
                return <MapBlock lat={link.metadata?.lat} lng={link.metadata?.lng} address={link.metadata?.address} variant={variant} className={colSpan} />;
            case 'qr_code':
                return <QRCodeBlock link={link} profile={profile} />;
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
