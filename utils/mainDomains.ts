/**
 * Hostnames where the Gather app itself is served (as opposed to a user's
 * custom domain). Shared by edge middleware, API routes and the client.
 *
 * Matching is exact, plus any subdomain of domains we own outright. A
 * substring check (`hostname.includes(d)`) would treat hosts such as
 * `gather.link.attacker.com` or `localhost.evil.com` as ours.
 */
export const MAIN_DOMAINS = [
    'localhost',
    'gather.link',
    'app.gather.link',
    'gather-link.vercel.app',
    'links.trak.in',
];

/** Domains whose every subdomain is ours (we control their DNS). */
const OWNED_PARENT_DOMAINS = ['gather.link'];

export function isMainDomain(hostname: string, extra: string[] = []): boolean {
    const host = hostname.toLowerCase().replace(/\.$/, '');
    if (MAIN_DOMAINS.includes(host) || extra.includes(host)) return true;
    return OWNED_PARENT_DOMAINS.some(parent => host.endsWith(`.${parent}`));
}

/**
 * Server-side only: this deployment's own hostnames (Vercel preview and
 * branch URLs, and the configured app URL), so links keep working there.
 */
export function deploymentHosts(): string[] {
    if (typeof process === 'undefined' || !process.env) return [];
    const hosts = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL];
    try {
        if (process.env.NEXT_PUBLIC_APP_URL) hosts.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname);
    } catch { /* ignore malformed env */ }
    return hosts.filter((h): h is string => !!h).map(h => h.toLowerCase());
}
