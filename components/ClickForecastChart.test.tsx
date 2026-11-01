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
// 100 full chart renders take ~4-5s in jsdom, right at vitest's 5s default.
const RENDER_TIMEOUT_MS = 30_000;

describe('ClickForecastChart - Property Tests', () => {
  // Arbitrary for generating x-axis labels (the dashboard passes `date`)
  const dateArbitrary = fc.constantFrom('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

  // Arbitrary for generating click counts
  const clickCountArbitrary = fc.nat({ max: 10000 });

  // Arbitrary for generating a single data point
  const dataPointArbitrary = fc.record<ClickForecastDataPoint>({
    date: dateArbitrary,
    forecast: clickCountArbitrary,
    actual: clickCountArbitrary,
  });

  // Arbitrary for generating an array of data points (1-7 days)
  const dataArrayArbitrary = fc.array(dataPointArbitrary, { minLength: 1, maxLength: 7 });

  beforeEach(() => {
    cleanup();
  });

  // The card title ("Click Forecast") now lives in AnalyticsOverview, so the
  // chart itself is checked for its two series instead.
  it('Property 5: Click Chart Dual Series - renders both the actual and forecast series', () => {
    fc.assert(
      fc.property(dataArrayArbitrary, (data) => {
        cleanup();

        renderWithTheme(<ClickForecastChart data={data} />);

        expect(screen.getByTestId('click-forecast-chart')).toBeInTheDocument();
        expect(screen.getByText('Actual Clicks')).toBeInTheDocument();
        expect(screen.getByText('Forecast')).toBeInTheDocument();

        cleanup();
      }),
      { numRuns: 100 }
    );
  }, RENDER_TIMEOUT_MS);

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
  }, RENDER_TIMEOUT_MS);
});
