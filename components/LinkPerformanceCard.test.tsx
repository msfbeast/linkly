import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import LinkPerformanceCard, {
  LinkCategory,
  categoryColorMap,
  getCategoryColors,
} from './LinkPerformanceCard';

/**
 * **Feature: dashboard-ui-redesign, Property 3: Link Card Rendering Completeness**
 * *For any* link data object, the rendered LinkPerformanceCard component should
 * display the category label, title, creation date, and click count.
 * **Validates: Requirements 2.2**
 */
describe('LinkPerformanceCard - Property Tests', () => {
  const allCategories: LinkCategory[] = ['social', 'marketing', 'product', 'other'];

  // Arbitrary for generating valid category types
  const categoryArbitrary = fc.constantFrom<LinkCategory>(...allCategories);

  // Arbitrary for generating non-empty strings (for title and shortCode)
  const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);

  // Arbitrary for generating date strings
  const dateStringArbitrary = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2025-12-31'),
  }).map(d => d.toLocaleDateString());

  // Arbitrary for generating click counts
  const clicksArbitrary = fc.nat({ max: 1000000 });

  beforeEach(() => {
    cleanup();
  });

  it('Property 3: Link Card Rendering Completeness - all required fields are displayed', () => {
    fc.assert(
      fc.property(
        categoryArbitrary,
        nonEmptyStringArbitrary,
        nonEmptyStringArbitrary,
        dateStringArbitrary,
        clicksArbitrary,
        (category, title, shortCode, createdAt, clicks) => {
          cleanup();

          const handleMenuClick = vi.fn();

          render(
            <LinkPerformanceCard
              category={category}
              title={title}
              shortCode={shortCode}
              createdAt={createdAt}
              clicks={clicks}
              onMenuClick={handleMenuClick}
            />
          );

          // Verify category label is displayed
          const categoryLabel = screen.getByTestId('category-label');
          expect(categoryLabel).toBeInTheDocument();
          expect(categoryLabel.textContent?.toLowerCase()).toBe(category);

          // Verify title is displayed
          const titleElement = screen.getByTestId('card-title');
          expect(titleElement).toBeInTheDocument();
          expect(titleElement.textContent).toBe(title);

          // Verify creation date is displayed
          const dateElement = screen.getByTestId('created-date');
          expect(dateElement).toBeInTheDocument();
          expect(dateElement.textContent).toBe(createdAt);

          // Verify click count is displayed
          const clicksElement = screen.getByTestId('click-count');
          expect(clicksElement).toBeInTheDocument();
          expect(clicksElement.textContent).toContain(clicks.toLocaleString());

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: dashboard-ui-redesign, Property 4: Category Color Mapping Consistency**
 * *For any* category type (social, marketing, product, other), the assigned color
 * should match the predefined color mapping and remain consistent across all usages.
 * **Validates: Requirements 2.3, 4.4, 6.3**
 */
describe('LinkPerformanceCard - Category Color Mapping', () => {
  const allCategories: LinkCategory[] = ['social', 'marketing', 'product', 'other'];
  const categoryArbitrary = fc.constantFrom<LinkCategory>(...allCategories);

  beforeEach(() => {
    cleanup();
  });

  it('Property 4: Category Color Mapping Consistency - colors match predefined mapping', () => {
    fc.assert(
      fc.property(
        categoryArbitrary,
        (category) => {
          // Verify getCategoryColors returns the correct mapping
          const colors = getCategoryColors(category);
          const expectedColors = categoryColorMap[category];

          expect(colors.bg).toBe(expectedColors.bg);
          expect(colors.text).toBe(expectedColors.text);
          expect(colors.label).toBe(expectedColors.label);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: Category Color Mapping Consistency - rendered card uses correct colors', () => {
    fc.assert(
      fc.property(
        categoryArbitrary,
        (category) => {
          cleanup();

          render(
            <LinkPerformanceCard
              category={category}
              title="Test Title"
              shortCode="abc123"
              createdAt="01/01/2024"
              clicks={100}
              onMenuClick={() => {}}
            />
          );

          const expectedColors = categoryColorMap[category];

          // Verify the card container has the correct background color class
          const card = screen.getByTestId('link-performance-card');
          expect(card.className).toContain(expectedColors.bg);

          // Verify the category label has the correct label color class
          const categoryLabel = screen.getByTestId('category-label');
          expectedColors.label.split(' ').forEach(cls => {
            expect(categoryLabel.className).toContain(cls);
          });

          // Verify the title has the correct text color class
          const titleElement = screen.getByTestId('card-title');
          expect(titleElement.className).toContain(expectedColors.text);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
