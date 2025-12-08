import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HealthScoreCard } from './HealthScoreCard';

describe('HealthScoreCard', () => {
    const mockMetrics = {
        avgClicks: 120,
        growth: 15,
        engagement: 4.5,
        reach: 1000,
    };

    it('renders the score correctly', () => {
        render(<HealthScoreCard score={79} metrics={mockMetrics} />);
        expect(screen.getByText('79%')).toBeInTheDocument();
    });

    it('displays "Fair" label for score 79', () => {
        render(<HealthScoreCard score={79} metrics={mockMetrics} />);
        expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    it('displays "Good" label for score 90', () => {
        render(<HealthScoreCard score={90} metrics={mockMetrics} />);
        expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('displays "Poor" label for score 40', () => {
        render(<HealthScoreCard score={40} metrics={mockMetrics} />);
        expect(screen.getByText('Poor')).toBeInTheDocument();
    });
});
