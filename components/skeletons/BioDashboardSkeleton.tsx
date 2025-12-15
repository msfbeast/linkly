import React from 'react';

export const BioDashboardSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-stone-200 rounded-lg"></div>
                        <div className="h-4 w-64 bg-stone-200 rounded-lg"></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="h-10 w-64 bg-stone-200 rounded-xl"></div>
                        <div className="h-10 w-28 bg-stone-200 rounded-xl"></div>
                        <div className="h-10 w-36 bg-stone-200 rounded-xl"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 h-[180px]">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-stone-200"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 w-3/4 bg-stone-200 rounded-lg"></div>
                                    <div className="h-4 w-1/2 bg-stone-200 rounded-lg"></div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between">
                                <div className="h-4 w-16 bg-stone-200 rounded-lg"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 bg-stone-200 rounded-lg"></div>
                                    <div className="h-8 w-8 bg-stone-200 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
