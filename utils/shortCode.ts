/** Letters and digits that can't be misread for each other (no 0/o, 1/l/i). */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * A random short code for a new link. links.short_code is unique and the
 * database does not generate one, so every insert needs its own.
 * 7 characters from 31 gives about 27.5 billion codes.
 */
export function newShortCode(length = 7): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let code = '';
    for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
    return code;
}
