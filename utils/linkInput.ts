import { safeWebUrl } from './safeUrl';

/** Same rule as the database (public.check_link_fields). */
export const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const SHORT_CODE_RULE = 'Short codes can only use letters, numbers, hyphens and underscores (up to 64).';
export const DESTINATION_RULE = 'Enter a web address, like https://example.com/page.';

export const isValidShortCode = (code: unknown): code is string =>
    typeof code === 'string' && SHORT_CODE_PATTERN.test(code);

/**
 * A link destination ready to save: https:// added when missing, a title
 * pasted in front dropped. Bio widgets (widget://) pass through. Throws with
 * a message for the person when it isn't a web address.
 */
export function cleanDestination(raw: unknown): string {
    if (typeof raw === 'string' && /^widget:\/\//i.test(raw.trim())) return raw.trim();
    const url = safeWebUrl(raw);
    if (!url) throw new Error(DESTINATION_RULE);
    return url;
}

/** Throws with a message for the person when the short code isn't allowed. */
export function checkShortCode(code: unknown): string {
    if (!isValidShortCode(code)) throw new Error(SHORT_CODE_RULE);
    return code;
}
