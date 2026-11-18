import React from 'react';

/** Gather's mark: a charcoal tile with an orange square, as in the app's top bar. */
const GatherMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <span className="flex items-center justify-center rounded-[10px] bg-[#18181A]" style={{ width: size, height: size }} aria-hidden="true">
        <span className="rounded-[3px] bg-[#FF5A14]" style={{ width: size * 0.32, height: size * 0.32 }} />
    </span>
);

export default GatherMark;
