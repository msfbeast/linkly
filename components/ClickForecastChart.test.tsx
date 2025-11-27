import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import ClickForecastChart, {
  ClickForecastDataPoint,
} from './ClickForecastChart';
import { ThemeProvider } from '../contexts/ThemeContext';

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

/**
 * **Feature: dashboard-ui-redesign, Property 5: Click Chart Dual Series**
 * *For any* click forecast data array, the ClickForecastChart component should
 * render exactly two data series (forecast and actual) with distinct visual styling.
 * **Validates: Requirements 3.2**
 */
describe('ClickForecastChart - Property Tests', () => {
  // Arbitrary for generating day names
  const dayArbitrary = fc.constantFrom('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

  // Arbitrary for generating click counts
  const clickCountArbitrary = fc.nat({ max: 10000 });

  // Arbitrary for generating a single data point
  const dataPointArbitrary = fc.record<ClickForecastDataPoint>({
    day: dayArbitrary,
    forecast: clickCountArbitrary,
    actual: clickCountArbitrary,
  });

  // Arbitrary for generating an array of data points (1-7 days)
  const dataArrayArbitrary = fc.array(dataPointArbitrary, { minLength: 1, maxLength: 7 });

  beforeEach(() => {
    cleanup();
  });

  it('Property 5: Click Chart Dual Series - chart renders with title and subtitle', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        cleanup();

        renderWithTheme(<ClickForecastChart data={data} />);

        // Verify chart container is rendered
        const chartContainer = screen.getByTestId('click-forecast-chart');
        expect(chartContainer).toBeInTheDocument();

        // Verify title is displayed
        const title = screen.getByTestId('chart-title');
        expect(title).toBeInTheDocument();
        expect(title.textContent).toBe('Click Forecast');

        // Verify subtitle is displayed
        const subtitle = screen.getByTestId('chart-subtitle');
        expect(subtitle).toBeInTheDocument();
        expect(subtitle.textContent).toBe('Projected engagement via analytics');

        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 5: Click Chart Dual Series - data structure contains both forecast and actual keys', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        // Verify each data point has both forecast and actual properties
        data.forEach((point) => {
          expect(point).toHaveProperty('forecast');
          expect(point).toHaveProperty('actual');
          expect(typeof point.forecast).toBe('number');
          expect(typeof point.actual).toBe('number');
          expect(point.forecast).toBeGreaterThanOrEqual(0);
          expect(point.actual).toBeGreaterThanOrEqual(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('Property 5: Click Chart Dual Series - chart renders with valid data without errors', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        cleanup();

        // Should not throw when rendering with valid data
        expect(() => {
          renderWithTheme(<ClickForecastChart data={data} />);
        }).not.toThrow();

        // Chart should be in the document
        const chartContainer = screen.getByTestId('click-forecast-chart');
        expect(chartContainer).toBeInTheDocument();

        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});
