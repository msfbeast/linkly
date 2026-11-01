import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isLinkAllowedOnDomain } from '../customDomainAccess';

type Row = Record<string, unknown>;

/** Minimal stand-in for supabase.from(t).select().eq()...maybeSingle(). */
function fakeSupabase(tables: Record<string, Row[]>): SupabaseClient {
    return {
        from(table: string) {
            const filters: [string, unknown][] = [];
            const query = {
                select: () => query,
                eq: (col: string, val: unknown) => { filters.push([col, val]); return query; },
                maybeSingle: async () => ({
                    data: (tables[table] || []).find(r => filters.every(([c, v]) => r[c] === v)) ?? null,
                    error: null,
                }),
            };
            return query;
        },
    } as unknown as SupabaseClient;
}

const OWNER = 'owner-1';
const TEAMMATE = 'mate-2';
const STRANGER = 'stranger-3';

const db = fakeSupabase({
    domains: [{ domain: 'brand.com', user_id: OWNER, status: 'active' }],
    teams: [
        { id: 'team-member', owner_id: 'someone-else' },
        { id: 'team-owned', owner_id: OWNER },
        { id: 'team-other', owner_id: STRANGER },
    ],
    team_members: [
        { team_id: 'team-member', user_id: OWNER },
        { team_id: 'team-member', user_id: TEAMMATE },
    ],
    links: [
        { short_code: 'own', user_id: OWNER, team_id: null },
        { short_code: 'team', user_id: TEAMMATE, team_id: 'team-member' },
        { short_code: 'owned-team', user_id: TEAMMATE, team_id: 'team-owned' },
        { short_code: 'mate-personal', user_id: TEAMMATE, team_id: null },
        { short_code: 'other-team', user_id: STRANGER, team_id: 'team-other' },
        { short_code: 'stranger', user_id: STRANGER, team_id: null },
    ],
});

describe('isLinkAllowedOnDomain', () => {
    it("allows the domain owner's own links", async () => {
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'own')).toBe(true);
        expect(await isLinkAllowedOnDomain(db, 'BRAND.com', 'own')).toBe(true);
    });

    it("allows team links for a team the owner is a member of", async () => {
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'team')).toBe(true);
    });

    it("allows team links for a team the owner owns", async () => {
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'owned-team')).toBe(true);
    });

    it("blocks a teammate's personal links", async () => {
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'mate-personal')).toBe(false);
    });

    it("blocks links from teams the owner isn't in, and other users' links", async () => {
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'other-team')).toBe(false);
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'stranger')).toBe(false);
    });

    it('blocks everything on unknown or inactive domains and for unknown codes', async () => {
        expect(await isLinkAllowedOnDomain(db, 'unknown.com', 'own')).toBe(false);
        expect(await isLinkAllowedOnDomain(db, 'brand.com', 'missing')).toBe(false);
    });
});
