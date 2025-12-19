/**
 * Parses a CSV string into an array of objects.
 * Assumes the first row is the header.
 * Handles simple CSVs (no complex escaping/quotes for now, or basic handling).
 */
export interface CsvLinkImport {
    url: string;
    title?: string;
    shortCode?: string;
    tags?: string; // pipe separated or comma? let's say comma
}

export const parseCsv = (content: string): any[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
            // Basic handling for common fields
            if (values[index] !== undefined) {
                // Remove quotes if present
                let val = values[index];
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.slice(1, -1);
                }
                row[header] = val;
            }
        });
        data.push(row);
    }
    return data;
};

export const validateLinkImport = (row: any): CsvLinkImport | null => {
    // Map common CSV headers to our format
    const url = row.url || row.originalurl || row.link || row.target;
    const title = row.title || row.name;
    const shortCode = row.shortcode || row.slug || row.code;
    const tags = row.tags || row.tag;

    if (!url) return null;

    // Basic URL validation
    try {
        new URL(url);
    } catch {
        if (!url.startsWith('http')) return null; // simplistic check if new URL failed but might be valid with http
    }

    return {
        url,
        title: title || new URL(url).hostname,
        shortCode,
        tags
    };
};
