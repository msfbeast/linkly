import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { BrowserRouter } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    signOut: vi.fn(),
  }),
}));

/**
 * Wrapper component that provides necessary context for TopNavigation
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>{children}</ThemeProvider>
  </BrowserRouter>
);

/**
 * **Feature: dashboard-ui-redesign, Property 1: Click Stats Display**
 * *For any* total clicks value and change percentage, the TopNavigation
 * should display them correctly formatted.
 * **Validates: Requirements 1.2**
 */
describe('TopNavigation - Property Tests', () => {
  beforeEach(() => {
    cleanup();
  });

  it('Property 1: Click Stats Display - displays total clicks and change correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }), // total clicks
        fc.integer({ min: -100, max: 100 }), // click change percentage
        (totalClicks, clickChange) => {
          cleanup();

          render(
            <TestWrapper>
              <TopNavigation
                totalClicks={totalClicks}
                clickChange={clickChange}
                onNewLinkClick={() => {}}
              />
            </TestWrapper>
          );

          // Verify total clicks is displayed
          expect(screen.getByText(totalClicks.toLocaleString())).toBeDefined();

          // Verify change percentage is displayed with correct sign
          const expectedChangeText = clickChange >= 0 
            ? `+${clickChange}%` 
            : `${clickChange}%`;
          expect(screen.getByText(expectedChangeText)).toBeDefined();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should call onNewLinkClick when New Link button is clicked', () => {
    const handleNewLinkClick = vi.fn();

    render(
      <TestWrapper>
        <TopNavigation
          totalClicks={1000}
          clickChange={5}
          onNewLinkClick={handleNewLinkClick}
        />
      </TestWrapper>
    );

    const newLinkButton = screen.getByRole('button', { name: /new link/i });
    fireEvent.click(newLinkButton);

    expect(handleNewLinkClick).toHaveBeenCalledTimes(1);
  });

});
