import { describe, it, expect } from 'vitest';
import { processHeatmapData } from '../analyticsService';
import { ClickEvent } from '../../types';

describe('Analytics Service - Heatmap Logic', () => {
    it('should initialize a 7x24 grid with zeros', () => {
        const data = processHeatmapData([]);

        expect(data).toHaveLength(7); // 7 days
        data.forEach(day => {
            expect(day.hours).toHaveLength(24);
            day.hours.forEach(hour => {
                expect(hour.count).toBe(0);
            });
        });

        expect(data[0].day).toBe('Sunday');
        expect(data[6].day).toBe('Saturday');
    });

    it('should correctly map clicks to day and hour', () => {
        // Create a fixed date: Monday, Dec 25 2023, 10:30 AM
        // 2023-12-25 is a Monday
        const mondayMorning = new Date('2023-12-25T10:30:00').getTime();

        // Tuesday, Dec 26 2023, 23:59 PM (11 PM hour block)
        const tuesdayNight = new Date('2023-12-26T23:59:00').getTime();

        const events: ClickEvent[] = [
            { timestamp: mondayMorning } as any,
            { timestamp: mondayMorning } as any, // 2 clicks on Monday 10am
            { timestamp: tuesdayNight } as any,   // 1 click on Tuesday 11pm
        ];

        const data = processHeatmapData(events);

        // Check Monday (Index 1) at 10 AM (Index 10)
        expect(data[1].day).toBe('Monday');
        expect(data[1].hours[10].count).toBe(2);

        // Check Tuesday (Index 2) at 11 PM (Index 23)
        expect(data[2].day).toBe('Tuesday');
        expect(data[2].hours[23].count).toBe(1);

        // Ensure other slots are empty
        expect(data[1].hours[9].count).toBe(0);
    });

    it('should handle timezone edge cases (e.g. late Sunday night)', () => {
        // Sunday 11 PM
        // 2023-12-24 is a Sunday
        const sundayNight = new Date('2023-12-24T23:00:00').getTime();

        const events: ClickEvent[] = [{ timestamp: sundayNight } as any];
        const data = processHeatmapData(events);

        expect(data[0].day).toBe('Sunday');
        expect(data[0].hours[23].count).toBe(1);
    });
});
