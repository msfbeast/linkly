import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LinkData, ClickEvent, LinkCategory } from '../../types';
import { ExportData } from '../storage/types';
import { generateCSVExport } from '../csvExportService';

/**
 * **Feature: production-analytics, Property 11: CSV export contains all required fields**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * For any ExportData with links and click events, the generated CSV SHALL contain
 * columns for title, originalUrl, shortCode, createdAt, clicks, and for each click
 * event: timestamp, referrer, device, os, country.
 */
describe('CSV Export Property Tests', () => {
  // Generator for valid device types
  const deviceTypeArb = fc.constantFrom('Mobile', 'Desktop', 'Tablet', 'Other') as fc.Arbitrary<ClickEvent['device']>;
  
  // Generator for valid OS types
  const osTypeArb = fc.constantFrom('iOS', 'Android', 'Windows', 'MacOS', 'Linux', 'Other') as fc.Arbitrary<ClickEvent['os']>;
  
  // Generator for valid link categories
  const categoryArb = fc.constantFrom('social', 'marketing', 'product', 'other') as fc.Arbitrary<LinkCategory>;

  // Generator for click events with simple strings (no special CSV characters for easier validation)
  const clickEventArb: fc.Arbitrary<ClickEvent> = fc.record({
    timestamp: fc.integer({ min: 1000000000000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
    referrer: fc.string({ minLength: 0, maxLength: 50 }).map(s => s.replace(/[,"\n\r]/g, '')),
    device: deviceTypeArb,
    os: osTypeArb,
    country: fc.option(fc.constantFrom('US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN', 'Unknown'), { nil: undefined }),
  });

  // Generator for smart redirects
  const smartRedirectsArb = fc.option(
    fc.record({
      ios: fc.option(fc.webUrl(), { nil: undefined }),
      android: fc.option(fc.webUrl(), { nil: undefined }),
      desktop: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    { nil: undefined }
  );

  // Generator for AI analysis
  const aiAnalysisArb = fc.option(
    fc.record({
      sentiment: fc.string(),
      category: fc.string(),
      predictedEngagement: fc.constantFrom('High', 'Medium', 'Low') as fc.Arbitrary<'High' | 'Medium' | 'Low'>,
    }),
    { nil: undefined }
  );


  // Generator for valid LinkData objects with simple strings for CSV testing
  const linkDataArb: fc.Arbitrary<LinkData> = fc.record({
    id: fc.uuid(),
    originalUrl: fc.webUrl(),
    shortCode: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[,"\n\r\s]/g, 'x') || 'abc'),
    title: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[,"\n\r]/g, '') || 'title').filter(s => s.trim().length > 0),
    description: fc.option(fc.string(), { nil: undefined }),
    tags: fc.array(fc.string(), { maxLength: 5 }),
    createdAt: fc.integer({ min: 1000000000000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
    category: fc.option(categoryArb, { nil: undefined }),
    clicks: fc.integer({ min: 0, max: 1000000 }),
    lastClickedAt: fc.option(fc.integer({ min: 0, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }), { nil: undefined }),
    clickHistory: fc.array(clickEventArb, { maxLength: 10 }),
    smartRedirects: smartRedirectsArb,
    geoRedirects: fc.option(fc.dictionary(fc.string({ minLength: 2, maxLength: 3 }), fc.webUrl()), { nil: undefined }),
    expirationDate: fc.option(fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 }), { nil: null }),
    maxClicks: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null }),
    password: fc.option(fc.string(), { nil: null }),
    qrCodeData: fc.option(fc.string(), { nil: undefined }),
    aiAnalysis: aiAnalysisArb,
  });

  // Generator for ExportData
  const exportDataArb: fc.Arbitrary<ExportData> = fc.record({
    links: fc.array(linkDataArb, { minLength: 0, maxLength: 10 }),
    clickEvents: fc.array(clickEventArb, { minLength: 0, maxLength: 20 }),
    exportedAt: fc.integer({ min: 1000000000000, max: Date.now() + 365 * 24 * 60 * 60 * 1000 }),
  });

  /**
   * Property 11: CSV export contains link headers
   * The generated CSV SHALL contain headers for link data: title, originalUrl, shortCode, createdAt, clicks
   */
  it('should contain all required link headers in CSV output', () => {
    fc.assert(
      fc.property(
        exportDataArb,
        (data) => {
          const csv = generateCSVExport(data);
          
          // Check that link headers are present
          expect(csv).toContain('title');
          expect(csv).toContain('originalUrl');
          expect(csv).toContain('shortCode');
          expect(csv).toContain('createdAt');
          expect(csv).toContain('clicks');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: CSV export contains click event headers
   * The generated CSV SHALL contain headers for click events: timestamp, referrer, device, os, country
   */
  it('should contain all required click event headers in CSV output', () => {
    fc.assert(
      fc.property(
        exportDataArb,
        (data) => {
          const csv = generateCSVExport(data);
          
          // Check that click event headers are present (in the Click Events section)
          const clickEventsSection = csv.split('# Click Events')[1];
          expect(clickEventsSection).toBeDefined();
          expect(clickEventsSection).toContain('timestamp');
          expect(clickEventsSection).toContain('referrer');
          expect(clickEventsSection).toContain('device');
          expect(clickEventsSection).toContain('os');
          expect(clickEventsSection).toContain('country');
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 11: CSV export contains all link data values
   * For any link in the export data, its title, shortCode, and clicks should appear in the CSV
   */
  it('should contain all link data values in CSV output', () => {
    fc.assert(
      fc.property(
        exportDataArb.filter(d => d.links.length > 0),
        (data) => {
          const csv = generateCSVExport(data);
          
          // Each link's data should be present in the CSV
          for (const link of data.links) {
            // Title should be present (may be escaped if contains special chars)
            expect(csv).toContain(link.title);
            // ShortCode should be present
            expect(csv).toContain(link.shortCode);
            // Clicks count should be present
            expect(csv).toContain(String(link.clicks));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: CSV export contains all click event data values
   * For any click event in the export data, its device, os, and country should appear in the CSV
   */
  it('should contain all click event data values in CSV output', () => {
    fc.assert(
      fc.property(
        exportDataArb.filter(d => d.clickEvents.length > 0),
        (data) => {
          const csv = generateCSVExport(data);
          const clickEventsSection = csv.split('# Click Events')[1];
          
          // Each click event's data should be present in the CSV
          for (const event of data.clickEvents) {
            // Device should be present
            expect(clickEventsSection).toContain(event.device);
            // OS should be present
            expect(clickEventsSection).toContain(event.os);
            // Country should be present (or 'Unknown' if undefined)
            expect(clickEventsSection).toContain(event.country || 'Unknown');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: CSV export row count matches data count
   * The number of data rows in each section should match the input array lengths
   */
  it('should have correct number of rows for links and click events', () => {
    fc.assert(
      fc.property(
        exportDataArb,
        (data) => {
          const csv = generateCSVExport(data);
          const sections = csv.split('# Click Events');
          
          // Links section (includes header row)
          const linksSection = sections[0].split('# Links')[1].trim();
          const linkRows = linksSection.split('\n').filter(row => row.trim().length > 0);
          // +1 for header row
          expect(linkRows.length).toBe(data.links.length + 1);
          
          // Click events section (includes header row)
          const clickEventsSection = sections[1].trim();
          const clickRows = clickEventsSection.split('\n').filter(row => row.trim().length > 0);
          // +1 for header row
          expect(clickRows.length).toBe(data.clickEvents.length + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: CSV export handles empty data gracefully
   * When there are no links or click events, the CSV should still have headers
   */
  it('should handle empty data with headers only', () => {
    fc.assert(
      fc.property(
        fc.record({
          links: fc.constant([] as LinkData[]),
          clickEvents: fc.constant([] as ClickEvent[]),
          exportedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
        }),
        (data) => {
          const csv = generateCSVExport(data);
          
          // Should still have section markers and headers
          expect(csv).toContain('# Links');
          expect(csv).toContain('# Click Events');
          expect(csv).toContain('title,originalUrl,shortCode,createdAt,clicks');
          expect(csv).toContain('timestamp,referrer,device,os,country');
        }
      ),
      { numRuns: 10 }
    );
  });
});
