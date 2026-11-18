import type { StoreLook } from './storePage';

/** Tailwind classes for the store page's two looks; the bio editor preview uses the same ones. */
export const STORE_LOOKS: Record<StoreLook, Record<string, string>> = {
    light: {
        page: 'bg-[#ECEBE7] text-[#18181A]',
        tile: 'bg-[#FBFAF8]',
        card: 'bg-white',
        image: 'bg-[#F7F6F3]',
        muted: 'text-[#8C8981]',
        soft: 'bg-[#F0EEEA] text-[#4A4843]',
        softHover: 'hover:bg-[#E6E3DD]',
        active: 'bg-[#18181A] text-[#F2F1EE]',
        input: 'text-[#18181A] placeholder:text-[#A19E97]',
        bar: 'bg-[#ECEBE7]/90',
    },
    dark: {
        page: 'bg-[#111113] text-[#F2F1EE]',
        tile: 'bg-[#18181A]',
        card: 'bg-[#1E1E21]',
        image: 'bg-[#26262A]',
        muted: 'text-[#8E8B84]',
        soft: 'bg-[#232326] text-[#C9C6BF]',
        softHover: 'hover:bg-[#2B2B2E]',
        active: 'bg-[#F2F1EE] text-[#18181A]',
        input: 'text-[#F2F1EE] placeholder:text-[#77746D]',
        bar: 'bg-[#111113]/90',
    },
};
