import { describe, it, expect } from 'vitest';
import { countLocations } from '../LiveWorldMap';
import type { ClickEvent } from '../../types';

const countries = [{ name: 'India', value: 70 }, { name: 'United States', value: 20 }, { name: 'Unknown', value: 9 }];
const regions = [
    { country: 'India', region: 'Maharashtra', value: 50 },
    { country: 'India', region: 'Delhi', value: 20 },
    { country: 'United States', region: 'California', value: 20 },
];

describe('countLocations', () => {
    it('uses precomputed country counts for the world view, without Unknown', () => {
        expect(countLocations('world', [], countries, regions)).toEqual({ India: 70, 'United States': 20 });
    });

    it('uses precomputed state counts for the India and USA views', () => {
        expect(countLocations('india', [], countries, regions)).toEqual({ Maharashtra: 50, Delhi: 20 });
        expect(countLocations('usa', [], countries, regions)).toEqual({ California: 20 });
    });

    it('still counts raw clicks when no counts are given', () => {
        const clicks = [
            { country: 'India', region: 'Delhi' },
            { country: 'India', region: 'Delhi' },
            { country: 'United States', region: 'Texas' },
        ] as ClickEvent[];
        expect(countLocations('world', clicks)).toEqual({ India: 2, 'United States': 1 });
        expect(countLocations('india', clicks)).toEqual({ Delhi: 2 });
    });
});
