import React from 'react';

export const BioSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center py-16 px-4 animate-pulse">
            {/* Avatar Skeleton */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-stone-200 rounded-full mb-6"></div>

            {/* Profile Info Skeleton */}
            <div className="w-48 h-8 bg-stone-200 rounded-xl mb-3"></div>
            <div className="w-72 h-4 bg-stone-200 rounded-lg mb-8 opacity-70"></div>

            {/* Links Skeleton */}
            <div className="w-full max-w-lg space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="h-16 bg-stone-200 rounded-[2rem] w-full transform transition-all"
                        style={{ opacity: 1 - (i * 0.15) }} // Fade out effect/stagger visual
                    ></div>
                ))}
            </div>

            {/* Social Icons Skeleton - optional bottom */}
            <div className="flex gap-4 mt-8">
                <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
                <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
                <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
            </div>
        </div>
    );
};
