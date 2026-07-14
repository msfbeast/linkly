import React from 'react';

interface NewsletterBlockProps {
    userId: string;
    title?: string;
    description?: string;
    buttonText?: string;
}

/**
 * FEATURE RETIRED (2026-07): Newsletter was cut — trak.in has real
 * newsletter infrastructure and the in-app manager was removed, so this
 * public signup block must not silently collect subscribers. Stub keeps
 * templates compiling. To restore:
 *   git log --oneline -- components/blocks/NewsletterBlock.tsx
 */
export const NewsletterBlock: React.FC<NewsletterBlockProps> = () => null;

export default NewsletterBlock;
