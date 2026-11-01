/**
 * Link-preview fetchers and crawlers. They follow a short link to build a
 * preview card or index it, not because a person clicked, so the redirect
 * sends them on without counting a click. (The browser redirect page never
 * counted them either: they don't run JavaScript.)
 */
const BOT_PATTERN = new RegExp([
    'bot\\b', 'bot/', 'crawler', 'spider', 'preview', 'scraper', 'fetcher',
    'facebookexternalhit', 'facebookcatalog', 'meta-externalagent', 'whatsapp',
    'telegrambot', 'twitterbot', 'slackbot', 'slack-imgproxy', 'linkedinbot',
    'discordbot', 'skypeuripreview', 'pinterest', 'redditbot', 'embedly',
    'iframely', 'googlebot', 'bingbot', 'applebot', 'yandex', 'baiduspider',
    'duckduckbot', 'petalbot', 'headlesschrome', 'lighthouse',
    'curl/', 'wget/', 'python-requests', 'go-http-client', 'okhttp', 'axios/', 'node-fetch',
].join('|'), 'i');

export function isBot(userAgent: string | null | undefined): boolean {
    if (!userAgent) return true; // real browsers always send one
    return BOT_PATTERN.test(userAgent);
}

/** Phones and tablets: their redirects go through the browser page, which opens native apps. */
export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
    return /Android|iPhone|iPad|iPod/i.test(userAgent || '');
}
