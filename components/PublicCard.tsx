import React from 'react';

/** Centered card on the app's grey, with the Gather mark above: for public one-off pages. */
const PublicCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#ECEBE7] p-4 text-[#18181A]">
        <a href="/" className="mb-5 flex items-center gap-2 text-[15px] font-medium" aria-label="Gather">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#18181A]"><span className="h-2 w-2 rounded-[2px] bg-[#FF5A14]" /></span>
            Gather
        </a>
        <main className="w-full max-w-[420px] rounded-3xl bg-[#FBFAF8] p-6 sm:p-8">{children}</main>
    </div>
);

export default PublicCard;
