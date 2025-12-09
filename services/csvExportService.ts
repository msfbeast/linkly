import { LinkData, ClickEvent } from '../types';
import { ExportData } from './storage/types';

/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Escapes internal quotes by doubling them
 */
function escapeCSVValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }

  const stringValue = String(value);

  // Check if value needs escaping
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a timestamp as ISO date string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Generates CSV content for links data
 */
function generateLinksCSV(links: LinkData[]): string {
  const headers = ['title', 'originalUrl', 'shortCode', 'createdAt', 'clicks'];
  const rows: string[] = [headers.join(',')];

  for (const link of links) {
    const row = [
      escapeCSVValue(link.title),
      escapeCSVValue(link.originalUrl),
      escapeCSVValue(link.shortCode),
      escapeCSVValue(formatTimestamp(link.createdAt)),
      escapeCSVValue(link.clicks),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generates CSV content for click events data
 */
function generateClickEventsCSV(clickEvents: ClickEvent[]): string {
  const headers = ['timestamp', 'referrer', 'device', 'os', 'country'];
  const rows: string[] = [headers.join(',')];

  for (const event of clickEvents) {
    const row = [
      escapeCSVValue(formatTimestamp(event.timestamp)),
      escapeCSVValue(event.referrer),
      escapeCSVValue(event.device),
      escapeCSVValue(event.os),
      escapeCSVValue(event.country || 'Unknown'),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}


/**
 * Generates a combined CSV export containing both links and click events
 * 
 * Format:
 * - Links section with headers: title, originalUrl, shortCode, createdAt, clicks
 * - Blank line separator
 * - Click events section with headers: timestamp, referrer, device, os, country
 * 
 * @param data - ExportData containing links and clickEvents
 * @returns CSV string with all data
 */
export function generateCSVExport(data: ExportData): string {
  const linksCSV = generateLinksCSV(data.links);
  const clickEventsCSV = generateClickEventsCSV(data.clickEvents);

  // Combine with section headers for clarity
  const sections = [
    '# Links',
    linksCSV,
    '',
    '# Click Events',
    clickEventsCSV,
  ];

  return sections.join('\n');
}

/**
 * Triggers a browser download of the CSV content
 * 
 * @param content - CSV string content to download
 * @param filename - Name for the downloaded file (should end with .csv)
 */
export function downloadCSV(content: string, filename: string): void {
  // Create a Blob with the CSV content
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  // Create a temporary link element
  const link = document.createElement('a');

  // Create object URL for the blob
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL
  URL.revokeObjectURL(url);
}

/**
 * Convenience function to export and download all data
 * 
 * @param data - ExportData containing links and clickEvents
 * @param filename - Optional custom filename (defaults to gather-export-{date}.csv)
 */
export function exportAndDownload(data: ExportData, filename?: string): void {
  const csvContent = generateCSVExport(data);
  const defaultFilename = `linkly-export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}
