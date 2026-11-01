import { describe, it, expect } from 'vitest';
import { countryName, regionName, geoFromVercelHeaders } from '../geoNames';

describe('geoNames', () => {
    it('gives the country names the dashboard groups by', () => {
        expect(countryName('IN')).toBe('India');
        expect(countryName('us')).toBe('United States');
        expect(countryName(null)).toBeNull();
    });

    it("uses ip-api's spellings for Indian and US regions", () => {
        expect(regionName('IN', 'MH')).toBe('Maharashtra');
        expect(regionName('IN', 'DL')).toBe('National Capital Territory of Delhi');
        expect(regionName('IN', 'TG')).toBe('Telangana');
        expect(regionName('US', 'DC')).toBe('Washington, D.C.');
        expect(regionName('GB', 'ENG')).toBe('ENG');
        expect(regionName('IN', null)).toBeNull();
    });

    it('reads every Vercel geo header, decoding the city', () => {
        const headers = new Headers({
            'x-vercel-ip-country': 'IN',
            'x-vercel-ip-country-region': 'KA',
            'x-vercel-ip-city': 'Bengal%C5%ABru',
            'x-vercel-ip-latitude': '12.97',
            'x-vercel-ip-longitude': '77.59',
        });
        expect(geoFromVercelHeaders(headers)).toEqual({
            country: 'India',
            countryCode: 'IN',
            region: 'Karnataka',
            city: 'Bengalūru',
            latitude: 12.97,
            longitude: 77.59,
        });
        expect(geoFromVercelHeaders(new Headers())).toMatchObject({ country: null, region: null, latitude: null });
    });
});
