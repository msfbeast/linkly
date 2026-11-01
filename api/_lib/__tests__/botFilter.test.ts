import { describe, it, expect } from 'vitest';
import { isBot, isMobileUserAgent } from '../botFilter';

describe('isBot', () => {
    it('flags preview fetchers, crawlers and scripts', () => {
        for (const ua of [
            'WhatsApp/2.23.20.0 A', 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'TelegramBot (like TwitterBot)',
            'LinkedInBot/1.0', 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'curl/8.4.0', 'python-requests/2.31',
            '', null,
        ]) expect(isBot(ua), String(ua)).toBe(true);
    });

    it('lets real browsers through, including in-app browsers', () => {
        for (const ua of [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0',
            'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Version/4.0 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0]',
        ]) expect(isBot(ua), ua).toBe(false);
    });
});

describe('isMobileUserAgent', () => {
    it('spots phones and tablets', () => {
        expect(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(true);
        expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14; SM-S921B)')).toBe(true);
        expect(isMobileUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false);
    });
});
