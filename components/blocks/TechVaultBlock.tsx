import React from 'react';
import { TechVaultItem, WidgetVariant } from '../../types';

interface TechVaultBlockProps {
    userId?: string;
    items?: TechVaultItem[];
    title?: string;
    variant?: WidgetVariant;
    className?: string;
}

/**
 * FEATURE RETIRED (2026-07): Tech Vault was cut to reduce maintenance
 * surface. This stub keeps the 25+ bio templates that reference it
 * compiling while rendering nothing. To restore, recover the previous
 * implementation from git history:
 *   git log --oneline -- components/blocks/TechVaultBlock.tsx
 */
export const TechVaultBlock: React.FC<TechVaultBlockProps> = () => null;

export default TechVaultBlock;
