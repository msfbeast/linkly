import { GalleryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extracts the Google Drive Folder ID from various URL formats.
 */
export const extractDriveFolderId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]{25,50})/);
  return match ? match[1] : null;
};

/**
 * Formats decimal exposure time to standard shutter speed format (e.g. 0.00833 -> 1/120s)
 */
export const formatShutterSpeed = (exposureTime: number | undefined): string => {
  if (!exposureTime) return '1/120s';
  if (exposureTime >= 1) return `${Math.round(exposureTime * 10) / 10}s`;
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
};

/**
 * Fetches all images inside a public Google Drive folder and maps them to GalleryItems.
 */
export const fetchDriveFolderImages = async (folderId: string): Promise<any[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  if (!apiKey) {
    throw new Error('Google API Key not configured. Please add VITE_GOOGLE_API_KEY to your environment.');
  }

  // Query Google Drive API v3 for files in this folder
  const query = `'${folderId}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false`;
  const fields = 'files(id,name,mimeType,size,imageMediaMetadata)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Drive folder: ${response.statusText}`);
  }

  const data = await response.json();
  const files = data.files || [];

  return files.map((file: any, index: number) => {
    const exif = file.imageMediaMetadata || {};
    const sizeMb = file.size ? (parseInt(file.size) / (1024 * 1024)).toFixed(1) + ' MB' : 'Original';
    
    // We use the high-performance Googleusercontent CDN for direct rendering
    const publicUrl = `https://lh3.googleusercontent.com/d/${file.id}`;

    // Format category based on indices
    const category = index === 0 ? 'Main (1x)' : index === 1 ? 'Telephoto (3.7x)' : index === 2 ? 'Night (1x)' : 'Ultrawide (0.6x)';

    return {
      id: uuidv4(),
      title: file.name.split('.')[0],
      category,
      description: '',
      url: publicUrl,
      camera: exif.cameraModel || exif.cameraMake || 'Custom Camera',
      sensor: exif.lens || 'Standard Sensor',
      aperture: exif.aperture ? `f/${exif.aperture}` : 'f/1.8',
      iso: exif.isoSpeed ? String(exif.isoSpeed) : '100',
      shutter: formatShutterSpeed(exif.exposureTime),
      size: `${sizeMb} (RAW)`
    };
  });
};
