import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import TrafficSourceChart, {
  calculateTrafficTotal,
} from './TrafficSourceChart';
import { TrafficSourceDataPoint } from '../types';
import { ThemeProvider } from '../contexts/ThemeContext';

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

/**
 * **Feature: dashboard-ui-redesign, Property 6: Traffic Source Total Calculation**
 * *For any* traffic source data array, the total displayed in the donut chart center
 * should equal the sum of all individual source values.
 * **Validates: Requirements 4.2**
 */
describe('TrafficSourceChart - Property Tests', () => {
  // Arbitrary for generating source names
  const sourceNameArbitrary = fc.constantFrom('Direct', 'Social', 'Referral', 'Email', 'Organic');

  // Arbitrary for generating click counts
  const clickCountArbitrary = fc.nat({ max: 100000 });

  // Arbitrary for generating colors
  const colorArbitrary = fc.constantFrom('#22d3ee', '#a855f7', '#f97316', '#22c55e', '#ef4444');

  // Arbitrary for generating a single data point
  const dataPointArbitrary: fc.Arbitrary<TrafficSourceDataPoint> = fc.record({
    name: sourceNameArbitrary,
    value: clickCountArbitrary,
    color: colorArbitrary,
  });

  // Arbitrary for generating an array of data points (1-5 sources)
  const dataArrayArbitrary = fc.array(dataPointArbitrary, { minLength: 1, maxLength: 5 });

  beforeEach(() => {
    cleanup();
  });

  it('Property 6: Traffic Source Total Calculation - calculateTrafficTotal returns sum of all values', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        const calculatedTotal = calculateTrafficTotal(data);
        const expectedTotal = data.reduce((sum, item) => sum + item.value, 0);

        expect(calculatedTotal).toBe(expectedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Traffic Source Total Calculation - total displayed matches provided total prop', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        cleanup();

        const total = calculateTrafficTotal(data);

        renderWithTheme(<TrafficSourceChart data={data} total={total} />);

        // Verify the total display shows the correct value
        const totalDisplay = screen.getByTestId('total-display');
        expect(totalDisplay).toBeInTheDocument();
        expect(totalDisplay.textContent).toBe(total.toLocaleString());

        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Traffic Source Total Calculation - chart renders with title and subtitle', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        cleanup();

        const total = calculateTrafficTotal(data);

        renderWithTheme(<TrafficSourceChart data={data} total={total} />);

        // Verify chart container is rendered
        const chartContainer = screen.getByTestId('traffic-source-chart');
        expect(chartContainer).toBeInTheDocument();

        // Verify title is displayed
        const title = screen.getByTestId('chart-title');
        expect(title).toBeInTheDocument();
        expect(title.textContent).toBe('Traffic Sources');

        // Verify subtitle is displayed
        const subtitle = screen.getByTestId('chart-subtitle');
        expect(subtitle).toBeInTheDocument();
        expect(subtitle.textContent).toBe('Where your clicks come from');

        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Traffic Source Total Calculation - empty array returns zero total', () => {
    const emptyData: TrafficSourceDataPoint[] = [];
    const total = calculateTrafficTotal(emptyData);
    expect(total).toBe(0);
  });
});
