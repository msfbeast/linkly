import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import * as fc from 'fast-check';
import PriorityLinksList, {
  PriorityLink,
  PriorityLinkStatus,
  statusColorMap,
  getStatusColors,
  getStatusLabel,
} from './PriorityLinksList';

/**
 * **Feature: dashboard-ui-redesign, Property 7: Priority Link Rendering Completeness**
 * *For any* priority link data object, the rendered list item should display
 * a checkbox, title, short code, last click time, and status tag.
 * **Validates: Requirements 6.2**
 */
describe('PriorityLinksList - Property Tests', () => {
  const allStatuses: PriorityLinkStatus[] = ['active', 'expiring', 'low-ctr'];

  // Arbitrary for generating valid status types
  const statusArbitrary = fc.constantFrom<PriorityLinkStatus>(...allStatuses);

  // Arbitrary for generating non-empty strings
  const nonEmptyStringArbitrary = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0);

  // Arbitrary for generating alphanumeric short codes
  const shortCodeArbitrary = fc.stringMatching(/^[a-zA-Z0-9]{3,10}$/);

  // Arbitrary for generating last click time strings
  const lastClickTimeArbitrary = fc.constantFrom(
    '2 min ago',
    '1 hour ago',
    '3 hours ago',
    'Yesterday',
    '2 days ago',
    'Last week'
  );

  // Arbitrary for generating a single priority link
  const priorityLinkArbitrary = fc.record({
    id: fc.uuid(),
    title: nonEmptyStringArbitrary,
    shortCode: shortCodeArbitrary,
    lastClickedAt: lastClickTimeArbitrary,
    status: statusArbitrary,
    checked: fc.boolean(),
  });

  beforeEach(() => {
    cleanup();
  });


  it('Property 7: Priority Link Rendering Completeness - all required fields are displayed', () => {
    fc.assert(
      fc.property(priorityLinkArbitrary, (link) => {
        cleanup();

        const handleToggle = vi.fn();
        const handleViewAll = vi.fn();

        render(
          <PriorityLinksList
            links={[link]}
            onLinkToggle={handleToggle}
            onViewAll={handleViewAll}
          />
        );

        const linkItem = screen.getByTestId('priority-link-item');
        expect(linkItem).toBeInTheDocument();

        // Verify checkbox is displayed
        const checkbox = within(linkItem).getByTestId('link-checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute('type', 'checkbox');
        expect((checkbox as HTMLInputElement).checked).toBe(link.checked);

        // Verify title is displayed
        const titleElement = within(linkItem).getByTestId('link-title');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement.textContent).toBe(link.title);

        // Verify short code is displayed
        const shortCodeElement = within(linkItem).getByTestId('link-short-code');
        expect(shortCodeElement).toBeInTheDocument();
        expect(shortCodeElement.textContent).toContain(link.shortCode);

        // Verify last click time is displayed
        const lastClickElement = within(linkItem).getByTestId('last-click-time');
        expect(lastClickElement).toBeInTheDocument();
        expect(lastClickElement.textContent).toBe(link.lastClickedAt);

        // Verify status tag is displayed
        const statusTag = within(linkItem).getByTestId('status-tag');
        expect(statusTag).toBeInTheDocument();
        expect(statusTag.textContent?.toLowerCase().replace(/\s/g, '-')).toContain(
          link.status === 'low-ctr' ? 'low' : link.status
        );

        cleanup();
      }),
      { numRuns: 100 }
    );
  });

  it('Property 7: Status colors are applied correctly for all status types', () => {
    fc.assert(
      fc.property(statusArbitrary, (status) => {
        // Verify getStatusColors returns the correct mapping
        const colors = getStatusColors(status);
        const expectedColors = statusColorMap[status];

        expect(colors.bg).toBe(expectedColors.bg);
        expect(colors.text).toBe(expectedColors.text);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 7: Status labels are correctly formatted', () => {
    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const label = getStatusLabel(status);

        // Verify label is non-empty
        expect(label.length).toBeGreaterThan(0);

        // Verify label matches expected format
        const expectedLabels: Record<PriorityLinkStatus, string> = {
          active: 'Active',
          expiring: 'Expiring',
          'low-ctr': 'Low CTR',
        };
        expect(label).toBe(expectedLabels[status]);
      }),
      { numRuns: 100 }
    );
  });

  it('View All button is always displayed', () => {
    fc.assert(
      fc.property(fc.array(priorityLinkArbitrary, { minLength: 0, maxLength: 10 }), (links) => {
        cleanup();

        const handleToggle = vi.fn();
        const handleViewAll = vi.fn();

        render(
          <PriorityLinksList
            links={links}
            onLinkToggle={handleToggle}
            onViewAll={handleViewAll}
          />
        );

        // Verify "View All" button is always present
        const viewAllButton = screen.getByTestId('view-all-button');
        expect(viewAllButton).toBeInTheDocument();
        expect(viewAllButton.textContent).toContain('View All');

        cleanup();
      }),
      { numRuns: 100 }
    );
  });
});
