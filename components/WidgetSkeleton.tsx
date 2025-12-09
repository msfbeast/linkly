import React from 'react';

export const WidgetSkeleton = () => {
    return (
        <div className="w-full h-full min-h-[120px] bg-stone-100 animate-pulse rounded-2xl flex items-center justify-center border border-stone-200">
            <div className="w-8 h-8 rounded-full bg-stone-200"></div>
        </div>
    );
};
